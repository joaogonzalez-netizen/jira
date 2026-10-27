import {
  configError,
  handleCreate,
  handleDelete,
  handleList,
  handleUpdate,
  loadConfig,
  resolveSessionFromCookie,
} from "../src/server/planning-core.js";
import { jsonBody, sendJson } from "./_lib/respond.js";

const config = loadConfig(process.env);

export default async function handler(req, res) {
  const misconfigured = configError(config);
  if (misconfigured) return sendJson(res, misconfigured);

  const q = (name) => (typeof req.query?.[name] === "string" ? req.query[name] : null);

  try {
    const session = await resolveSessionFromCookie(req.headers.cookie, config);
    if (req.method === "GET") return sendJson(res, await handleList(q("kind"), config));
    if (req.method === "POST") {
      const body = jsonBody(req);
      return sendJson(res, await handleCreate(body.kind, body, session, config));
    }
    if (req.method === "PATCH") {
      const body = jsonBody(req);
      return sendJson(res, await handleUpdate(body.kind, body.id, body, session, config));
    }
    if (req.method === "DELETE") {
      return sendJson(res, await handleDelete(q("kind"), q("id"), session, config));
    }
    return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
  } catch (e) {
    console.error("[planning]", e);
    return sendJson(res, { status: 500, body: { message: e.message || "Erro interno" } });
  }
}
