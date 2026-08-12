/**
 * Adaptador do Vite para o auth: serve `/api/auth/*` no dev server e no preview.
 *
 * A lógica toda vive em `auth-core.js`, compartilhada com as funções da Vercel
 * (`api/auth/*.js`) — aqui só se traduz `req`/`res` do Node. Em produção este
 * arquivo não roda: um `vite build` servido como estático puro sem as funções
 * fica sem as rotas, e o app cai na tela de login sem nunca criar sessão.
 */
import {
  AUTH_COOKIE,
  configError,
  handleLogin,
  handleLogout,
  handleMe,
  loadConfig,
  readCookie,
} from "./auth-core.js";

const MAX_BODY_BYTES = 64 * 1024;

function sendJson(res, result) {
  res.statusCode = result.status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (result.cookie) res.setHeader("Set-Cookie", result.cookie);
  res.end(JSON.stringify(result.body));
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

export function authApiPlugin(env) {
  const config = loadConfig(env);

  const handler = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/auth/")) return next();
    const route = req.url.split("?")[0];

    const misconfigured = configError(config);
    if (misconfigured) return sendJson(res, misconfigured);

    // dev e preview servem em http://localhost, então nada de cookie Secure.
    const secure = req.headers["x-forwarded-proto"] === "https";

    try {
      if (route === "/api/auth/login" && req.method === "POST") {
        return sendJson(res, await handleLogin(await readJsonBody(req), config, secure));
      }
      if (route === "/api/auth/logout" && req.method === "POST") {
        return sendJson(res, handleLogout(secure));
      }
      if (route === "/api/auth/me" && req.method === "GET") {
        return sendJson(res, await handleMe(readCookie(req.headers.cookie, AUTH_COOKIE), config));
      }
      return sendJson(res, { status: 404, body: { message: "Rota não encontrada" } });
    } catch (e) {
      console.error("[auth]", e);
      return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
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
