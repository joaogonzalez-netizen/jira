import {
  configError,
  handleCreate,
  handleDelete,
  handleList,
  handleUpdate,
  loadConfig,
  resolveSessionFromCookie,
} from "../src/server/initiatives-core.js";
import { jsonBody, sendJson } from "./_lib/respond.js";
import { scopeConfig } from "../src/server/workspace.js";

const configBase = loadConfig(process.env);

export default async function handler(req, res) {
  const misconfigured = configError(configBase);
  if (misconfigured) return sendJson(res, misconfigured);

  try {
    const config = await scopeConfig(configBase, req.headers.cookie);
    const session = await resolveSessionFromCookie(req.headers.cookie, config);
    if (req.method === "GET") return sendJson(res, await handleList(config));
    if (req.method === "POST") return sendJson(res, await handleCreate(jsonBody(req), session, config));
    if (req.method === "PATCH") {
      const body = jsonBody(req);
      return sendJson(res, await handleUpdate(body.id, body, session, config));
    }
    if (req.method === "DELETE") {
      const id = typeof req.query?.id === "string" ? req.query.id : null;
      return sendJson(res, await handleDelete(id, session, config));
    }
    return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
  } catch (e) {
    console.error("[initiatives]", e);
    return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
  }
}
