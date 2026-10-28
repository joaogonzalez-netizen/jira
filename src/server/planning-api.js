/**
 * Adaptador do Vite para o planejamento: serve `/api/planning` no dev server e
 * no preview. A lógica vive em `planning-core.js`, compartilhada com a função
 * da Vercel (`api/planning.js`) — aqui só se traduz `req`/`res` do Node, igual
 * a `initiatives-api.js`.
 */
import {
  configError,
  handleCreate,
  handleDelete,
  handleList,
  handleUpdate,
  loadConfig,
  resolveSessionFromCookie,
} from "./planning-core.js";
import { scopeConfig } from "./workspace.js";

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

export function planningApiPlugin(env) {
  const configBase = loadConfig(env);

  const handler = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/planning")) return next();
    const [route, query] = req.url.split("?");
    if (route !== "/api/planning") {
      return sendJson(res, { status: 404, body: { message: "Rota não encontrada" } });
    }

    const misconfigured = configError(configBase);
    if (misconfigured) return sendJson(res, misconfigured);

    try {
      const config = await scopeConfig(configBase, req.headers.cookie);
      const params = new URLSearchParams(query || "");
      const session = await resolveSessionFromCookie(req.headers.cookie, config);
      if (req.method === "GET") return sendJson(res, await handleList(params.get("kind"), config));
      if (req.method === "POST") {
        const body = await readJsonBody(req);
        return sendJson(res, await handleCreate(body.kind, body, session, config));
      }
      if (req.method === "PATCH") {
        const body = await readJsonBody(req);
        return sendJson(res, await handleUpdate(body.kind, body.id, body, session, config));
      }
      if (req.method === "DELETE") {
        return sendJson(res, await handleDelete(params.get("kind"), params.get("id"), session, config));
      }
      return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
    } catch (e) {
      console.error("[planning]", e);
      return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
    }
  };

  return {
    name: "fila-dev-planning-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
