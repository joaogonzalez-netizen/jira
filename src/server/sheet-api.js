/**
 * Adaptador do Vite para a sincronização da planilha: serve `/api/sheet/sync`
 * no dev server e no preview. A lógica toda vive em `sheet-core.js`,
 * compartilhada com a função da Vercel (`api/sheet/sync.js`) — aqui só se
 * traduz `req`/`res` do Node, igual ao `auth-api.js`.
 */
import { configError, handleSync, loadSheetConfig } from "./sheet-core.js";

function sendJson(res, result) {
  res.statusCode = result.status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(result.body));
}

export function sheetApiPlugin(env) {
  const config = loadSheetConfig(env);

  const handler = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/sheet/")) return next();
    const route = req.url.split("?")[0];
    if (route !== "/api/sheet/sync" || req.method !== "GET") {
      return sendJson(res, { status: 404, body: { message: "Rota não encontrada" } });
    }

    const misconfigured = configError(config);
    if (misconfigured) return sendJson(res, misconfigured);

    try {
      return sendJson(res, await handleSync(config));
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
