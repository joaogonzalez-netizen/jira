import {
  configError,
  handleSnapshotGet,
  handleSnapshotPut,
  loadConfig,
  resolveSessionFromCookie,
} from "../../src/server/roadmap-core.js";
import { jsonBody, sendJson } from "../_lib/respond.js";

const config = loadConfig(process.env);

export default async function handler(req, res) {
  const misconfigured = configError(config);
  if (misconfigured) return sendJson(res, misconfigured);

  try {
    if (req.method === "GET") return sendJson(res, await handleSnapshotGet(config));
    if (req.method === "PUT") {
      const session = await resolveSessionFromCookie(req.headers.cookie, config);
      return sendJson(res, await handleSnapshotPut(jsonBody(req), session, config));
    }
    return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
  } catch (e) {
    console.error("[roadmap/snapshot]", e);
    return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
  }
}
