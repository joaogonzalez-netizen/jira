import { configError, loadConfig, resolveSessionFromCookie } from "../../src/server/roadmap-core.js";
import { handleCancelEpic, handleCreateEpic, handleStatus, handleUpdateEpic, loadJiraConfig } from "../../src/server/jira-core.js";
import { jsonBody, sendJson } from "../_lib/respond.js";

const rcfg = loadConfig(process.env);
const jira = loadJiraConfig(process.env);

export default async function handler(req, res) {
  if (req.method === "GET") return sendJson(res, handleStatus(jira));

  const misconfigured = configError(rcfg);
  if (misconfigured) return sendJson(res, misconfigured);

  try {
    const session = await resolveSessionFromCookie(req.headers.cookie, rcfg);
    if (req.method === "POST") return sendJson(res, await handleCreateEpic(jsonBody(req), session, rcfg, jira));
    if (req.method === "PATCH") return sendJson(res, await handleUpdateEpic(jsonBody(req), session, rcfg, jira));
    if (req.method === "DELETE") {
      const key = typeof req.query?.key === "string" ? req.query.key : null;
      return sendJson(res, await handleCancelEpic({ key }, session, rcfg, jira));
    }
    return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
  } catch (e) {
    console.error("[jira/epics]", e);
    return sendJson(res, { status: 500, body: { message: "Erro interno ao falar com o Jira" } });
  }
}
