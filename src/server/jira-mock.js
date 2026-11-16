/**
 * Jira de mentira para o modo de teste local (`npm run dev:mock`): entende só o
 * necessário para criar um épico e mudar o status e o nome dele, sem rede e sem credencial
 * de verdade. Guarda o estado na memória do servidor de desenvolvimento.
 * Qualquer outra rota responde 501, em vez de fingir que funcionou.
 */

/** Status do workflow de épico (o mesmo em todos os projetos do Jira da empresa). */
export const MOCK_WORKFLOW = ["Backlog", "Produto", "[UX] Em andamento", "Em refinamento Técnico", "Pronto P/ DEV", "Em DEV", "Em rollout", "Done", "Cancelado"];

const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, text: async () => (body === undefined ? "" : JSON.stringify(body)) });

/** `rows` = as linhas de exemplo ("Key", "Summary", "Status"…); devolve um `fetch` compatível com o jiraFetch. */
export function createMockJiraFetch(rows) {
  const nextNumber = {};
  const issues = new Map(rows.map((r) => [r["Key"], { summary: r["Summary"] || "", status: r["Status"] || "Backlog", type: r["Issue Type"] || "Epic", description: null }]));
  return async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method || "GET";
    const body = init.body ? JSON.parse(init.body) : undefined;
    let m;
    if (method === "GET" && (m = u.pathname.match(/^\/rest\/api\/3\/issue\/([A-Z0-9]+-\d+)$/))) {
      const issue = issues.get(m[1]);
      if (!issue) return reply(404, { errorMessages: ["Issue does not exist"] });
      return reply(200, { fields: { summary: issue.summary, description: issue.description, status: { name: issue.status }, issuetype: { name: issue.type }, assignee: null } });
    }
    if (method === "GET" && (m = u.pathname.match(/^\/rest\/api\/3\/issue\/([A-Z0-9]+-\d+)\/transitions$/))) {
      const issue = issues.get(m[1]);
      if (!issue) return reply(404, { errorMessages: ["Issue does not exist"] });
      // o id da transição é a posição do status de destino no workflow
      return reply(200, { transitions: MOCK_WORKFLOW.map((s, i) => ({ id: String(i), name: s, to: { name: s } })).filter((t) => t.name !== issue.status) });
    }
    if (method === "POST" && (m = u.pathname.match(/^\/rest\/api\/3\/issue\/([A-Z0-9]+-\d+)\/transitions$/))) {
      const target = MOCK_WORKFLOW[Number(body?.transition?.id)];
      const issue = issues.get(m[1]);
      if (!issue || !target) return reply(400, { errorMessages: ["Transição inválida"] });
      issue.status = target;
      return reply(204);
    }
    if (method === "PUT" && (m = u.pathname.match(/^\/rest\/api\/3\/issue\/([A-Z0-9]+-\d+)$/))) {
      const issue = issues.get(m[1]);
      if (!issue) return reply(404, { errorMessages: ["Issue does not exist"] });
      if (body?.fields?.summary) issue.summary = body.fields.summary;
      if (body?.fields?.description !== undefined) issue.description = body.fields.description;
      return reply(204);
    }
    if (method === "GET" && (m = u.pathname.match(/^\/rest\/api\/3\/project\/([A-Z][A-Z0-9]*)$/))) {
      return reply(200, { issueTypes: [{ id: "10000", name: "Epic", hierarchyLevel: 1, subtask: false }, { id: "10001", name: "Story", hierarchyLevel: 0, subtask: false }] });
    }
    if (method === "GET" && /^\/rest\/api\/3\/issue\/createmeta\//.test(u.pathname)) return reply(404, { errorMessages: ["createmeta indisponível no Jira de teste"] });
    if (method === "POST" && u.pathname === "/rest/api/3/issue") {
      const project = body?.fields?.project?.key;
      if (!project) return reply(400, { errorMessages: ["project é obrigatório"] });
      const key = `${project}-${nextNumber[project] = (nextNumber[project] || 900) + 1}`;
      issues.set(key, { summary: body.fields.summary || "", status: "Backlog", type: "Epic", description: body.fields.description || null });
      return reply(201, { id: String(issues.size + 10000), key });
    }
    return reply(501, { errorMessages: [`O Jira de teste não implementa ${method} ${u.pathname}`] });
  };
}
