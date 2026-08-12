/**
 * Sessão da plataforma Product Ops, servida por este app.
 *
 * Roda no Node do Vite (dev e preview), NUNCA no browser: é o único jeito de
 * reusar o auth da plataforma sem afrouxá-lo. O que fica deste lado:
 *
 *   - o token vive num cookie httpOnly (`auth_token`), como na plataforma;
 *   - a assinatura do JWT é verificada com o JWT_SECRET, que não pode entrar no
 *     bundle (por isso as variáveis daqui NÃO têm prefixo VITE_);
 *   - a URL do n8n também não vaza pro cliente.
 *
 * Papéis (iguais aos da plataforma, ARCHITECTURE §3.1):
 *   super — claim `is_super` do próprio JWT. Manda em tudo.
 *   admin — concessão no projeto `fila-dev` (user_projects.role), resolvida a
 *           cada request pelo `projects.list`. Inclui card no Roadmap.
 *   user  — mesma concessão, só leitura.
 * Sem concessão nenhuma não há acesso: o app responde 403 e a tela de login diz
 * isso. Quem concede é a tela /users da plataforma — aqui nada é cadastrado.
 */
import { jwtVerify } from "jose";

const AUTH_COOKIE = "auth_token";
const SEVEN_DAYS_S = 60 * 60 * 24 * 7;
const MAX_BODY_BYTES = 64 * 1024;

// O n8n-ops fica atrás do Cloudflare, que devolve 403 (erro 1010) para request
// sem User-Agent de navegador. Sem isto o login falha com "credenciais
// inválidas" sem nunca ter chegado ao workflow.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

function setAuthCookie(res, token, maxAgeSeconds) {
  // `secure` fica fora de propósito: dev e preview servem em http://localhost, e
  // um cookie Secure ali simplesmente não é gravado — o login "funcionaria" e
  // nenhuma request seguinte teria sessão.
  res.setHeader(
    "Set-Cookie",
    `${AUTH_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`,
  );
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Corpo da requisição é grande demais"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed && typeof parsed === "object" ? parsed : {});
      } catch (e) {
        reject(new Error("Corpo da requisição não é JSON"));
      }
    });
    req.on("error", reject);
  });
}

/** Lê `exp` SEM verificar, só pra alinhar a validade do cookie à do token. A
    verificação de verdade acontece em `resolveSession`, a cada request. */
function tokenTtlSeconds(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return SEVEN_DAYS_S;
    const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const exp = JSON.parse(json).exp;
    if (typeof exp !== "number") return SEVEN_DAYS_S;
    const ttl = exp - Math.floor(Date.now() / 1000);
    return ttl > 0 ? ttl : SEVEN_DAYS_S;
  } catch (e) {
    return SEVEN_DAYS_S;
  }
}

function n8nFetch(config, path, body) {
  return fetch(`${config.n8nBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": BROWSER_UA },
    body: JSON.stringify(body),
  });
}

/**
 * Papel no projeto do app, pelas concessões da plataforma.
 *
 * Devolve `"admin"`, `"user"` ou `null` (sem acesso). Falha de rede ou resposta
 * inesperada também é `null`: sem lista de concessões ninguém entra — o mesmo
 * fail-closed do `getGrants()` da plataforma.
 */
async function projectRole(token, config) {
  const upstream = await n8nFetch(config, "/productops-api", {
    token,
    action: "projects.list",
    payload: {},
  }).catch(() => null);
  if (!upstream || !upstream.ok) {
    console.error("[auth] projects.list falhou:", upstream ? upstream.status : "sem resposta");
    return null;
  }
  const body = await upstream.json().catch(() => null);
  if (!body || body.success !== true || !Array.isArray(body.data)) {
    console.error("[auth] projects.list devolveu resposta inesperada");
    return null;
  }
  const row = body.data.find((p) => p && p.slug === config.projectSlug);
  if (!row) return null;
  return row.role === "admin" || row.role === "super" ? "admin" : "user";
}

/** Sessão do request, ou `null` quando não há. Nunca confia no cliente: papel e
    identidade saem do JWT verificado e das concessões, não do corpo da request. */
async function resolveSession(token, config) {
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, config.jwtSecret));
  } catch (e) {
    return null;
  }
  const user = {
    id: String(payload.sub ?? ""),
    email: typeof payload.email === "string" ? payload.email : null,
    name: typeof payload.name === "string" ? payload.name : null,
  };
  // `is_admin` é a claim legada da plataforma (pré-migration 008): só o
  // superusuário a tinha, então aceitá-la não promove ninguém.
  if (payload.is_super === true || payload.is_admin === true) {
    return { user, role: "super" };
  }
  const role = await projectRole(token, config);
  return role ? { user, role } : null;
}

function loadConfig(env) {
  const n8nBaseUrl = String(env.N8N_BASE_URL || "").replace(/\/+$/, "");
  const secret = String(env.JWT_SECRET || "");
  const missing = [];
  if (!n8nBaseUrl) missing.push("N8N_BASE_URL");
  if (!secret) missing.push("JWT_SECRET");
  if (missing.length) return { missing };
  return {
    missing: [],
    n8nBaseUrl,
    jwtSecret: new TextEncoder().encode(secret),
    projectSlug: String(env.PLATFORM_PROJECT_SLUG || "fila-dev"),
  };
}

/**
 * Plugin do Vite que serve `/api/auth/*` no dev server e no preview.
 *
 * Um `vite build` servido como estático puro (sem este Node na frente) fica sem
 * as rotas: o app cai na tela de login e nenhuma sessão é criada. É o preço de
 * não ter backend próprio — e o motivo de o app rodar por `npm run dev` /
 * `npm run preview`.
 */
export function authApiPlugin(env) {
  const config = loadConfig(env);

  const handler = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/auth/")) return next();
    const route = req.url.split("?")[0];

    if (config.missing.length) {
      return sendJson(res, 503, {
        message: `Auth não configurado: defina ${config.missing.join(" e ")} no .env.local`,
      });
    }

    try {
      if (route === "/api/auth/login" && req.method === "POST") {
        const body = await readJsonBody(req);
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";
        if (!email || !password) {
          return sendJson(res, 400, { message: "E-mail e senha são obrigatórios" });
        }

        const upstream = await n8nFetch(config, "/productops-login", { email, password });
        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok || data.success !== true || typeof data.token !== "string") {
          return sendJson(res, 401, { message: data.message || "Credenciais inválidas" });
        }

        // O papel é resolvido ANTES de gravar o cookie: quem não tem acesso ao
        // projeto não fica com sessão pendurada num app que vai negar tudo.
        const session = await resolveSession(data.token, config);
        if (!session) {
          return sendJson(res, 403, {
            message: "Sem acesso ao Fila Dev. Peça a concessão do projeto na plataforma.",
          });
        }

        setAuthCookie(res, data.token, tokenTtlSeconds(data.token));
        return sendJson(res, 200, session);
      }

      if (route === "/api/auth/logout" && req.method === "POST") {
        setAuthCookie(res, "", 0);
        return sendJson(res, 200, { ok: true });
      }

      if (route === "/api/auth/me" && req.method === "GET") {
        const session = await resolveSession(readCookie(req, AUTH_COOKIE), config);
        if (!session) return sendJson(res, 401, { message: "Não autenticado" });
        return sendJson(res, 200, session);
      }

      return sendJson(res, 404, { message: "Rota não encontrada" });
    } catch (e) {
      console.error("[auth]", e);
      return sendJson(res, 500, { message: e.message || "Erro interno" });
    }
  };

  return {
    name: "fila-dev-auth-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
