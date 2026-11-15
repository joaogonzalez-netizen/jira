import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchIssueRows, formatDate, formatDateTime, handleIssues, issueToRow } from "./jira-read-core.js";
import { loadJiraConfig } from "./jira-core.js";

const SUPER = { role: "super", user: { id: "1", email: "joao@x.com" } };
const LEITOR = { role: "user", user: { id: "4", email: "leitor@x.com" } };
const TOKEN = "SEGREDO-123-do-token";
const JIRA_ENV = { JIRA_EMAIL: "bot@stl.com", JIRA_API_TOKEN: TOKEN, JIRA_BASE_URL: "https://stl.atlassian.net" };

const FIELDS = [
  { id: "summary", name: "Summary", custom: false },
  { id: "customfield_10456", name: "Desenvolvedor", custom: true },
  { id: "customfield_10491", name: "Quem testou", custom: true },
  { id: "customfield_11091", name: "Tipo de entrega", custom: true },
  { id: "customfield_10524", name: "Data de início ", custom: true },
  { id: "customfield_10317", name: "Data Concluído", custom: true },
  { id: "customfield_10015", name: "Start date", custom: true },
];
const PROJECTS = [{ key: "FLIX", name: "STLFLIX" }, { key: "IA", name: "STL IA" }, { key: "POD", name: "ProductOps" }];

const issue = (key, project, extra = {}) => ({
  key,
  fields: {
    summary: `Resumo ${key}`,
    status: { name: "Em DEV" },
    issuetype: { name: "Story" },
    project: { name: project },
    assignee: { displayName: "Ana Souza" },
    reporter: { displayName: "João Gonzalez" },
    parent: { key: "FLIX-1" },
    priority: { name: "Medium" },
    created: "2026-11-05T17:36:13.555-0300",
    customfield_10456: { displayName: "Bruno Lima" },
    customfield_10491: null,
    customfield_11091: { value: "Sustentação", id: "1" },
    customfield_10524: "2026-11-05",
    customfield_10317: null,
    ...extra,
  },
});

/** Jira falso: `byProject` = issues de cada projeto, servidas em páginas de `pageSize`. */
function fakeJira({ byProject = {}, pageSize = 100, projects = PROJECTS, fail } = {}) {
  const calls = [];
  const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) });
  const fetch = async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method || "GET";
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, path: u.pathname, body, auth: init.headers?.Authorization });
    const forced = fail ? fail(u.pathname, method) : null;
    if (forced) return forced;
    if (method === "GET" && u.pathname === "/rest/api/3/field") return reply(200, FIELDS);
    if (method === "GET" && u.pathname === "/rest/api/3/project") return reply(200, projects);
    if (method === "POST" && u.pathname === "/rest/api/3/search/jql") {
      const key = body.jql.match(/^project = ([A-Z]+)/)[1];
      const all = byProject[key] || [];
      const start = body.nextPageToken ? Number(body.nextPageToken) : 0;
      const slice = all.slice(start, start + pageSize);
      const end = start + slice.length;
      return reply(200, end < all.length ? { issues: slice, nextPageToken: String(end) } : { issues: slice, isLast: true });
    }
    return reply(404, { errorMessages: ["rota inesperada"] });
  };
  return { calls, j: loadJiraConfig(JIRA_ENV, fetch) };
}

test("formatDateTime: horário de Brasília, no formato da planilha", () => {
  assert.equal(formatDateTime("2026-11-05T17:36:13.555-0300"), "05/11/2026 17:36:13");
  assert.equal(formatDateTime("2026-11-06T01:30:00.000+0000"), "05/11/2026 22:30:00");
  assert.equal(formatDateTime("2026-11-06T03:00:00.000+0000"), "06/11/2026 00:00:00"); // meia-noite não vira "24"
  assert.equal(formatDateTime(null), "");
  assert.equal(formatDateTime("lixo"), "");
});

test("formatDate: AAAA-MM-DD vira DD/MM/AAAA", () => {
  assert.equal(formatDate("2026-11-05"), "05/11/2026");
  assert.equal(formatDate(null), "");
  assert.equal(formatDate("05/11/2026"), "");
});

test("issueToRow: mesmas colunas que a planilha, campos customizados pelo id achado por nome", () => {
  const ids = { "Desenvolvedor": "customfield_10456", "Quem testou": "customfield_10491", "Tipo de entrega": "customfield_11091", "Data de início": "customfield_10524", "Data Concluído": "customfield_10317" };
  const row = issueToRow(issue("FLIX-9", "STLFLIX"), ids);
  assert.deepEqual(
    { ...row, _created: undefined },
    {
      "Key": "FLIX-9", "Project": "STLFLIX", "Issue Type": "Story", "Summary": "Resumo FLIX-9", "Status": "Em DEV",
      "Assignee": "Ana Souza", "Reporter": "João Gonzalez", "Desenvolvedor": "Bruno Lima", "Quem testou": "",
      "parent": "FLIX-1", "Tipo de entrega": "Sustentação", "Created": "05/11/2026 17:36:13",
      "Data de início": "05/11/2026", "Data Concluído": "", "Priority": "Medium", "_created": undefined,
    },
  );
});

test("issueToRow: issue sem campos opcionais não quebra", () => {
  const row = issueToRow({ key: "IA-1", fields: { summary: "x", status: { name: "Backlog" }, issuetype: { name: "Epic" }, project: { name: "STL IA" } } }, {});
  assert.equal(row["Assignee"], "");
  assert.equal(row["parent"], "");
  assert.equal(row["Tipo de entrega"], "");
  assert.equal(row["Created"], "");
});

test("fetchIssueRows: percorre todas as páginas, ordena da mais nova para a mais antiga e não vaza campo interno", async () => {
  const mk = (n, day) => issue(`FLIX-${n}`, "STLFLIX", { created: `2026-10-${String(day).padStart(2, "0")}T12:00:00.000-0300` });
  const { j, calls } = fakeJira({ pageSize: 2, byProject: { FLIX: [mk(5, 20), mk(4, 10), mk(3, 5)], IA: [issue("IA-1", "STL IA", { created: "2026-10-15T12:00:00.000-0300" })] } });
  const rows = await fetchIssueRows(j, ["FLIX", "IA"]);
  assert.deepEqual(rows.map((r) => r["Key"]), ["FLIX-5", "IA-1", "FLIX-4", "FLIX-3"]);
  assert.ok(rows.every((r) => !("_created" in r)));
  assert.equal(calls.filter((c) => c.path === "/rest/api/3/search/jql").length, 3); // FLIX: 2 páginas, IA: 1
});

test("fetchIssueRows: pede só os campos que usa, com os ids dos customizados", async () => {
  const { j, calls } = fakeJira({ byProject: { FLIX: [issue("FLIX-1", "STLFLIX")] } });
  await fetchIssueRows(j, ["FLIX"]);
  const search = calls.find((c) => c.path === "/rest/api/3/search/jql");
  for (const f of ["summary", "status", "issuetype", "project", "created", "customfield_10456", "customfield_10491", "customfield_11091", "customfield_10524", "customfield_10317"]) assert.ok(search.body.fields.includes(f), f);
  assert.ok(!search.body.fields.includes("customfield_10015")); // "Start date" não é a coluna "Data de início"
  assert.equal(search.body.maxResults, 100);
});

test("handleIssues: sem credencial -> 503, sem token no corpo", async () => {
  const j = loadJiraConfig({});
  const r = await handleIssues({}, SUPER, j);
  assert.equal(r.status, 503);
  assert.ok(!JSON.stringify(r).includes(TOKEN));
});

test("handleIssues: só admin/super lê", async () => {
  const { j, calls } = fakeJira();
  assert.equal((await handleIssues({}, LEITOR, j)).status, 403);
  assert.equal((await handleIssues({}, null, j)).status, 403);
  assert.equal(calls.length, 0);
});

test("handleIssues: padrão sem marcação lê só os projetos de produto (ProductOps e Custom ficam de fora)", async () => {
  const { j } = fakeJira({ projects: [...PROJECTS, { key: "CUSTOM", name: "Custom" }], byProject: { FLIX: [issue("FLIX-1", "STLFLIX")], IA: [issue("IA-1", "STL IA")], POD: [issue("POD-1", "ProductOps")], CUSTOM: [issue("CUSTOM-1", "Custom")] } });
  const r = await handleIssues({ isDefault: true }, SUPER, j);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.map((x) => x["Project"]).sort(), ["STL IA", "STLFLIX"]);
});

test("handleIssues: workspace ProductOps + Dados lê os dois e nada mais", async () => {
  const { j } = fakeJira({ projects: [...PROJECTS, { key: "DADOS", name: "Dados" }], byProject: { FLIX: [issue("FLIX-1", "STLFLIX")], POD: [issue("POD-1", "ProductOps")], DADOS: [issue("DADOS-1", "Dados")] } });
  const r = await handleIssues({ workspace: { jiraProjects: ["ProductOps", "Dados"] }, isDefault: false }, SUPER, j);
  assert.deepEqual(r.body.map((x) => x["Project"]).sort(), ["Dados", "ProductOps"]);
});

test("handleIssues: o padrão com projetos marcados (editado pelo super) respeita a marcação", async () => {
  const { j } = fakeJira({ byProject: { FLIX: [issue("FLIX-1", "STLFLIX")], IA: [issue("IA-1", "STL IA")] } });
  const r = await handleIssues({ workspace: { jiraProjects: ["STL IA"] }, isDefault: true }, SUPER, j);
  assert.deepEqual(r.body.map((x) => x["Key"]), ["IA-1"]);
});

test("handleIssues: workspace filtra pelos projetos marcados (sem acento nem caixa)", async () => {
  const { j, calls } = fakeJira({ byProject: { FLIX: [issue("FLIX-1", "STLFLIX")], POD: [issue("POD-1", "ProductOps")] } });
  const r = await handleIssues({ workspace: { jiraProjects: ["productops"] }, isDefault: false }, SUPER, j);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.map((x) => x["Key"]), ["POD-1"]);
  assert.ok(calls.every((c) => !c.body || !/FLIX|IA/.test(c.body.jql)));
});

test("handleIssues: workspace que não é o padrão e sem projetos marcados -> 409, sem chamar o Jira", async () => {
  const { j, calls } = fakeJira();
  const r = await handleIssues({ workspace: { jiraProjects: [] }, isDefault: false }, SUPER, j);
  assert.equal(r.status, 409);
  assert.equal(calls.length, 0);
});

test("handleIssues: o Jira recusou as credenciais -> erro claro, sem token", async () => {
  const { j } = fakeJira({ fail: (path) => (path === "/rest/api/3/project" ? { ok: false, status: 401, text: async () => "" } : null) });
  const r = await handleIssues({}, SUPER, j);
  assert.equal(r.status, 502);
  assert.match(r.body.message, /credenciais/);
  assert.ok(!JSON.stringify(r).includes(TOKEN));
});

test("handleIssues: limite de taxa (429) tenta de novo e termina", async () => {
  let limited = 0;
  const { j } = fakeJira({
    byProject: { FLIX: [issue("FLIX-1", "STLFLIX")] },
    fail: (path, method) => (path === "/rest/api/3/search/jql" && method === "POST" && limited++ < 1 ? { ok: false, status: 429, text: async () => "" } : null),
  });
  const r = await handleIssues({}, SUPER, j);
  assert.equal(r.status, 200);
  assert.equal(r.body.length, 1);
});

test("handleIssues: manda a autenticação Basic e só lê (nenhuma escrita)", async () => {
  const { j, calls } = fakeJira({ byProject: { FLIX: [issue("FLIX-1", "STLFLIX")] } });
  await handleIssues({}, SUPER, j);
  assert.ok(calls.every((c) => c.auth === `Basic ${Buffer.from(`bot@stl.com:${TOKEN}`).toString("base64")}`));
  assert.ok(calls.every((c) => c.method === "GET" || c.path === "/rest/api/3/search/jql")); // POST do search é leitura
  assert.ok(!calls.some((c) => ["PUT", "DELETE", "PATCH"].includes(c.method)));
});
