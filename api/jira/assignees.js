import { configError, loadConfig, resolveSessionFromCookie } from "../../src/server/roadmap-core.js";
import { handleListAssignees, handleListIssueTypes, loadJiraConfig } from "../../src/server/jira-core.js";
import { handleIssues } from "../../src/server/jira-read-core.js";
import { findWorkspace, scopeConfig } from "../../src/server/workspace.js";
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
    // Tipos de issue e a leitura das issues moram aqui também: o plano da Vercel aceita no máximo 12 funções.
    if (q.list === "issues") {
      const scoped = await scopeConfig(rcfg, req.headers.cookie);
      const isDefault = !scoped.workspace || scoped.workspace === "default";
      const workspace = rcfg.kv ? await findWorkspace(rcfg.kv, scoped.workspace) : null;
      return sendJson(res, await handleIssues({ workspace, isDefault }, session, jira));
    }
    if (q.list === "issue-types") return sendJson(res, await handleListIssueTypes({ product: typeof q.product === "string" ? q.product : null }, session, jira));
    return sendJson(res, await handleListAssignees({ key: typeof q.key === "string" ? q.key : null, product: typeof q.product === "string" ? q.product : null }, session, jira));
  } catch (e) {
    console.error("[jira/assignees]", e);
    return sendJson(res, { status: 500, body: { message: "Erro interno ao falar com o Jira" } });
  }
}
