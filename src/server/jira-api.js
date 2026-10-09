/**
 * Adaptador do Vite para a escrita no Jira: serve `/api/jira/epics` no dev
 * server e no preview. A lógica toda vive em `jira-core.js`, compartilhada com
 * a função da Vercel (`api/jira/epics.js`) — aqui só se traduz `req`/`res` do
 * Node, igual a `roadmap-api.js`.
 */
import { configError, loadConfig, resolveSessionFromCookie, sharedMemoryKv } from "./roadmap-core.js";
import { handleCancelEpic, handleCreateEpic, handleRenameEpic, handleStatus, loadJiraConfig } from "./jira-core.js";

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
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error("Corpo da requisição não é JSON"));
      }
    });
    req.on("error", reject);
  });
}

export function jiraApiPlugin(env) {
  // mesmo KV do roadmap-api.js: o documento é um só
  const rcfg = loadConfig(env, env.FILA_DEV_FAKE_KV === "1" ? sharedMemoryKv() : undefined);
  const jira = loadJiraConfig(env);

  const handler = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/jira")) return next();
    const [route, query] = req.url.split("?");
    if (route.replace(/\/+$/, "") !== "/api/jira/epics") {
      return sendJson(res, { status: 404, body: { message: "Rota não encontrada" } });
    }
    if (req.method === "GET") return sendJson(res, handleStatus(jira));

    const misconfigured = configError(rcfg);
    if (misconfigured) return sendJson(res, misconfigured);

    try {
      const session = await resolveSessionFromCookie(req.headers.cookie, rcfg);
      if (req.method === "POST") return sendJson(res, await handleCreateEpic(await readJsonBody(req), session, rcfg, jira));
      if (req.method === "PATCH") return sendJson(res, await handleRenameEpic(await readJsonBody(req), session, rcfg, jira));
      if (req.method === "DELETE") {
        const key = new URLSearchParams(query || "").get("key");
        return sendJson(res, await handleCancelEpic({ key }, session, rcfg, jira));
      }
      return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
    } catch (e) {
      console.error("[jira]", e);
      return sendJson(res, { status: 500, body: { message: "Erro interno ao falar com o Jira" } });
    }
  };

  return {
    name: "fila-dev-jira-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
