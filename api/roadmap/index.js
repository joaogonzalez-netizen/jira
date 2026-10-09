import {
  configError,
  handleGet,
  handlePatch,
  handleSeed,
  loadConfig,
  resolveSessionFromCookie,
} from "../../src/server/roadmap-core.js";
import { jsonBody, sendJson } from "../_lib/respond.js";

const config = loadConfig(process.env);

export default async function handler(req, res) {
  const misconfigured = configError(config);
  if (misconfigured) return sendJson(res, misconfigured);

  try {
    if (req.method === "GET") return sendJson(res, await handleGet(config));
    const session = await resolveSessionFromCookie(req.headers.cookie, config);
    if (req.method === "PATCH") return sendJson(res, await handlePatch(jsonBody(req), session, config));
    if (req.method === "POST") return sendJson(res, await handleSeed(jsonBody(req), session, config));
    return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
  } catch (e) {
    console.error("[roadmap]", e);
    return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
  }
}
