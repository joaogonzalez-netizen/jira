/**
 * Sessão da plataforma Product Ops — o núcleo, sem servidor nenhum.
 *
 * Roda em dois lugares e por isso não conhece nem `req` nem `res`: o plugin do
 * Vite (`src/server/auth-api.js`, dev e preview) e as funções da Vercel
 * (`api/auth/*.js`, produção). Cada adaptador só traduz entrada e saída.
 *
 * O que este arquivo garante, nos dois ambientes:
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

export const AUTH_COOKIE = "auth_token";
const SEVEN_DAYS_S = 60 * 60 * 24 * 7;

// O n8n-ops fica atrás do Cloudflare, que devolve 403 (erro 1010) para request
// sem User-Agent de navegador. Sem isto o login falha com "credenciais
// inválidas" sem nunca ter chegado ao workflow.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function loadConfig(env) {
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

export function readCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of String(cookieHeader).split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

/**
 * Monta o `Set-Cookie`.
 *
 * `secure` é decidido pelo protocolo do request, não por NODE_ENV: em https ele
 * é obrigatório, e em http://localhost um cookie Secure simplesmente não é
 * gravado — o login "funcionaria" e nenhuma request seguinte teria sessão.
 */
export function authCookieHeader(token, maxAgeSeconds, secure) {
  const flags = ["HttpOnly", "SameSite=Lax", "Path=/", `Max-Age=${maxAgeSeconds}`];
  if (secure) flags.push("Secure");
  return `${AUTH_COOKIE}=${encodeURIComponent(token)}; ${flags.join("; ")}`;
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
export async function resolveSession(token, config) {
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

/* =====================================================================
   HANDLERS — recebem valores simples e devolvem {status, body, cookie?}
   ===================================================================== */

export function configError(config) {
  if (!config.missing.length) return null;
  return {
    status: 503,
    body: { message: `Auth não configurado: defina ${config.missing.join(" e ")}` },
  };
}

export async function handleLogin(input, config, secure) {
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password) {
    return { status: 400, body: { message: "E-mail e senha são obrigatórios" } };
  }

  const upstream = await n8nFetch(config, "/productops-login", { email, password });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok || data.success !== true || typeof data.token !== "string") {
    return { status: 401, body: { message: data.message || "Credenciais inválidas" } };
  }

  // O papel é resolvido ANTES de gravar o cookie: quem não tem acesso ao
  // projeto não fica com sessão pendurada num app que vai negar tudo.
  const session = await resolveSession(data.token, config);
  if (!session) {
    return {
      status: 403,
      body: { message: "Sem acesso ao Fila Dev. Peça a concessão do projeto na plataforma." },
    };
  }

  return {
    status: 200,
    body: session,
    cookie: authCookieHeader(data.token, tokenTtlSeconds(data.token), secure),
  };
}

export function handleLogout(secure) {
  return { status: 200, body: { ok: true }, cookie: authCookieHeader("", 0, secure) };
}

export async function handleMe(token, config) {
  const session = await resolveSession(token, config);
  if (!session) return { status: 401, body: { message: "Não autenticado" } };
  return { status: 200, body: session };
}
