/**
 * Adaptador do Vite para as iniciativas: serve `/api/initiatives` no dev
 * server e no preview. A lógica toda vive em `initiatives-core.js`,
 * compartilhada com a função da Vercel (`api/initiatives.js`) — aqui só se
 * traduz `req`/`res` do Node, igual a `auth-api.js` e `sheet-api.js`.
 */
import {
  configError,
  handleCreate,
  handleDelete,
  handleList,
  handleUpdate,
  loadConfig,
  resolveSessionFromCookie,
} from "./initiatives-core.js";

const MAX_BODY_BYTES = 64 * 1024;

function sendJson(res, result) {
  res.statusCode = result.status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
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

export function initiativesApiPlugin(env) {
  const config = loadConfig(env);

  const handler = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/initiatives")) return next();
    const [route, query] = req.url.split("?");
    if (route !== "/api/initiatives") {
      return sendJson(res, { status: 404, body: { message: "Rota não encontrada" } });
    }

    const misconfigured = configError(config);
    if (misconfigured) return sendJson(res, misconfigured);

    try {
      const session = await resolveSessionFromCookie(req.headers.cookie, config);
      if (req.method === "GET") return sendJson(res, await handleList(config));
      if (req.method === "POST") return sendJson(res, await handleCreate(await readJsonBody(req), session, config));
      if (req.method === "PATCH") {
        const body = await readJsonBody(req);
        return sendJson(res, await handleUpdate(body.id, body, session, config));
      }
      if (req.method === "DELETE") {
        const id = new URLSearchParams(query || "").get("id");
        return sendJson(res, await handleDelete(id, session, config));
      }
      return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
    } catch (e) {
      console.error("[initiatives]", e);
      return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
    }
  };

  return {
    name: "fila-dev-initiatives-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
