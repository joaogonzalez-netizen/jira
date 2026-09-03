import { configError, handleSync, loadSheetConfig } from "../../src/server/sheet-core.js";
import { sendJson } from "../_lib/respond.js";

const config = loadSheetConfig(process.env);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
  }
  const misconfigured = configError(config);
  if (misconfigured) return sendJson(res, misconfigured);

  try {
    return sendJson(res, await handleSync(config));
  } catch (e) {
    console.error("[sheet/sync]", e);
    return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
  }
}
