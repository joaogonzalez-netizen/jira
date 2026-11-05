import { configError, handleSync, handleWorkspaceSync, loadSheetConfig } from "../../src/server/sheet-core.js";
import { loadConfig as loadKvConfig, readSheetIdOverride } from "../../src/server/sheet-config-core.js";
import { sendJson } from "../_lib/respond.js";
import { findWorkspace, scopeConfig } from "../../src/server/workspace.js";

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
    const isDefault = !kvConfig.workspace || kvConfig.workspace === "default";
    const workspace = kvConfigBase.kv ? await findWorkspace(kvConfigBase.kv, kvConfig.workspace) : null;
    const fetchRows = async (sheetId) => (await handleSync(config, sheetId)).body;
    return sendJson(res, await handleWorkspaceSync(fetchRows, override, workspace, isDefault));
  } catch (e) {
    console.error("[sheet/sync]", e);
    return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
  }
}
