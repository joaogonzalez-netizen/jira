import { configError, loadConfig, resolveSessionFromCookie } from "../../src/server/roadmap-core.js";
import { handleListAssignees, loadJiraConfig } from "../../src/server/jira-core.js";
import { sendJson } from "../_lib/respond.js";

const rcfg = loadConfig(process.env);
const jira = loadJiraConfig(process.env);

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
  const misconfigured = configError(rcfg);
  if (misconfigured) return sendJson(res, misconfigured);
  try {
    const session = await resolveSessionFromCookie(req.headers.cookie, rcfg);
    const q = req.query || {};
    return sendJson(res, await handleListAssignees({ key: typeof q.key === "string" ? q.key : null, product: typeof q.product === "string" ? q.product : null }, session, jira));
  } catch (e) {
    console.error("[jira/assignees]", e);
    return sendJson(res, { status: 500, body: { message: "Erro interno ao falar com o Jira" } });
  }
}
