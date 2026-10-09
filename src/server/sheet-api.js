/**
 * Adaptador do Vite para a planilha: serve `/api/sheet/sync` (sincroniza os
 * dados) e `/api/sheet/config` (lê/grava qual planilha usar) no dev server e
 * no preview. A lógica toda vive em `sheet-core.js` e `sheet-config-core.js`,
 * compartilhadas com as funções da Vercel (`api/sheet/sync.js` e
 * `api/sheet/config.js`) — aqui só se traduz `req`/`res` do Node, igual ao
 * `auth-api.js`.
 */
import { configError, handleSync, loadSheetConfig } from "./sheet-core.js";
import {
  configError as kvConfigError,
  handleGet as handleConfigGet,
  handleSet as handleConfigSet,
  loadConfig as loadKvConfig,
  readSheetIdOverride,
  resolveSessionFromCookie,
} from "./sheet-config-core.js";

const MAX_BODY_BYTES = 8 * 1024;

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

export function sheetApiPlugin(env) {
  const config = loadSheetConfig(env);
  const kvConfig = loadKvConfig(env);

  const handler = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/sheet/")) return next();
    const route = req.url.split("?")[0];

    try {
      if (route === "/api/sheet/sync" && req.method === "GET") {
        const misconfigured = configError(config);
        if (misconfigured) return sendJson(res, misconfigured);
        const override = await readSheetIdOverride(kvConfig);
        return sendJson(res, await handleSync(config, override));
      }
      if (route === "/api/sheet/config") {
        const misconfigured = kvConfigError(kvConfig);
        if (misconfigured) return sendJson(res, misconfigured);
        const session = await resolveSessionFromCookie(req.headers.cookie, kvConfig);
        if (req.method === "GET") return sendJson(res, await handleConfigGet(kvConfig, session));
        if (req.method === "PATCH") {
          const body = await readJsonBody(req);
          return sendJson(res, await handleConfigSet(body, session, kvConfig));
        }
        return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
      }
      return sendJson(res, { status: 404, body: { message: "Rota não encontrada" } });
    } catch (e) {
      console.error("[sheet]", e);
      return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
    }
  };

  return {
    name: "fila-dev-sheet-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
