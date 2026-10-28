import { configError, handleSync, loadSheetConfig } from "../../src/server/sheet-core.js";
import { loadConfig as loadKvConfig, readSheetIdOverride } from "../../src/server/sheet-config-core.js";
import { sendJson } from "../_lib/respond.js";
import { scopeConfig } from "../../src/server/workspace.js";

const config = loadSheetConfig(process.env);
const kvConfigBase = loadKvConfig(process.env);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
  }
  const misconfigured = configError(config);
  if (misconfigured) return sendJson(res, misconfigured);

  try {
    const kvConfig = await scopeConfig(kvConfigBase, req.headers.cookie);
    const override = await readSheetIdOverride(kvConfig);
    // Projeto novo sem planilha: não cai na planilha do STLFLIX.
    if (!override && kvConfig.workspace && kvConfig.workspace !== "default") {
      return sendJson(res, { status: 409, body: { message: "Este projeto ainda não tem planilha: configure em Configurações" } });
    }
    return sendJson(res, await handleSync(config, override));
  } catch (e) {
    console.error("[sheet/sync]", e);
    return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
  }
}
