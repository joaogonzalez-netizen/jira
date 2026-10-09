/**
 * Adaptador do Vite para o Roadmap compartilhado: serve `/api/roadmap` e
 * `/api/roadmap/snapshot` no dev server e no preview. A lógica toda vive em
 * `roadmap-core.js`, compartilhada com as funções da Vercel
 * (`api/roadmap/*.js`) — aqui só se traduz `req`/`res` do Node, igual a
 * `initiatives-api.js`.
 *
 * `FILA_DEV_FAKE_KV=1` troca o Redis por um KV em memória SÓ no dev server,
 * pra dar pra testar a tela inteira sem Redis. As funções da Vercel nunca
 * leem essa variável.
 */
import {
  configError,
  sharedMemoryKv,
  handleGet,
  handlePatch,
  handleSeed,
  handleSnapshotGet,
  handleSnapshotPut,
  loadConfig,
  resolveSessionFromCookie,
} from "./roadmap-core.js";

const MAX_BODY_BYTES = 4 * 1024 * 1024;

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

export function roadmapApiPlugin(env) {
  const config = loadConfig(env, env.FILA_DEV_FAKE_KV === "1" ? sharedMemoryKv() : undefined);

  const handler = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/roadmap")) return next();
    const route = req.url.split("?")[0].replace(/\/+$/, "");
    if (route !== "/api/roadmap" && route !== "/api/roadmap/snapshot") {
      return sendJson(res, { status: 404, body: { message: "Rota não encontrada" } });
    }

    const misconfigured = configError(config);
    if (misconfigured) return sendJson(res, misconfigured);

    try {
      if (route === "/api/roadmap/snapshot") {
        if (req.method === "GET") return sendJson(res, await handleSnapshotGet(config));
        if (req.method === "PUT") {
          const session = await resolveSessionFromCookie(req.headers.cookie, config);
          return sendJson(res, await handleSnapshotPut(await readJsonBody(req), session, config));
        }
        return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
      }
      if (req.method === "GET") return sendJson(res, await handleGet(config));
      const session = await resolveSessionFromCookie(req.headers.cookie, config);
      if (req.method === "PATCH") return sendJson(res, await handlePatch(await readJsonBody(req), session, config));
      if (req.method === "POST") return sendJson(res, await handleSeed(await readJsonBody(req), session, config));
      return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
    } catch (e) {
      console.error("[roadmap]", e);
      return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
    }
  };

  return {
    name: "fila-dev-roadmap-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
