import { test } from "node:test";
import assert from "node:assert/strict";
import { MOCK_WORKFLOW, createMockJiraFetch } from "./jira-mock.js";
import { createMemoryKv, handleGet, handleSeed, loadConfig } from "./roadmap-core.js";
import { handleUpdateEpic, loadJiraConfig } from "./jira-core.js";

const ROWS = [{ Key: "FLIX-1", Summary: "Um épico", Status: "Em DEV", "Issue Type": "Epic" }];
const url = (p) => `https://mock.atlassian.net${p}`;
const call = async (f, method, path, body) => {
  const r = await f(url(path), { method, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  return { status: r.status, body: text ? JSON.parse(text) : null };
};

test("Jira de teste: transições levam a cada status do workflow, menos o atual", async () => {
  const f = createMockJiraFetch(ROWS);
  const t = await call(f, "GET", "/rest/api/3/issue/FLIX-1/transitions");
  assert.equal(t.status, 200);
  const names = t.body.transitions.map((x) => x.to.name);
  assert.ok(!names.includes("Em DEV"));
  assert.deepEqual(names, MOCK_WORKFLOW.filter((s) => s !== "Em DEV"));
});

test("Jira de teste: a transição muda o status e o nome pode ser trocado", async () => {
  const f = createMockJiraFetch(ROWS);
  const t = (await call(f, "GET", "/rest/api/3/issue/FLIX-1/transitions")).body.transitions.find((x) => x.to.name === "Em rollout");
  assert.equal((await call(f, "POST", "/rest/api/3/issue/FLIX-1/transitions", { transition: { id: t.id } })).status, 204);
  assert.equal((await call(f, "PUT", "/rest/api/3/issue/FLIX-1", { fields: { summary: "Novo" } })).status, 204);
  const issue = (await call(f, "GET", "/rest/api/3/issue/FLIX-1?fields=status,summary")).body.fields;
  assert.equal(issue.status.name, "Em rollout");
  assert.equal(issue.summary, "Novo");
});

test("Jira de teste: issue que não existe é 404 e rota que não conhece é 501", async () => {
  const f = createMockJiraFetch(ROWS);
  assert.equal((await call(f, "GET", "/rest/api/3/issue/FLIX-99")).status, 404);
  assert.equal((await call(f, "DELETE", "/rest/api/3/issue/FLIX-1")).status, 501);
});

test("Jira de teste: cria épico com chave nova, numeração por projeto, e o épico passa a existir", async () => {
  const f = createMockJiraFetch(ROWS);
  assert.equal((await call(f, "GET", "/rest/api/3/project/FLIX")).body.issueTypes[0].name, "Epic");
  const a = await call(f, "POST", "/rest/api/3/issue", { fields: { project: { key: "FLIX" }, summary: "Novo A" } });
  const b = await call(f, "POST", "/rest/api/3/issue", { fields: { project: { key: "FLIX" }, summary: "Novo B" } });
  const c = await call(f, "POST", "/rest/api/3/issue", { fields: { project: { key: "IA" }, summary: "Novo C" } });
  assert.equal(a.status, 201);
  assert.deepEqual([a.body.key, b.body.key, c.body.key], ["FLIX-901", "FLIX-902", "IA-901"]);
  assert.equal((await call(f, "GET", `/rest/api/3/issue/${a.body.key}?fields=status`)).body.fields.status.name, "Backlog");
  assert.equal((await call(f, "POST", "/rest/api/3/issue", { fields: { summary: "sem projeto" } })).status, 400);
});

test("Jira de teste: o servidor real de mover status funciona de ponta a ponta sobre ele", async () => {
  const kv = createMemoryKv();
  const rcfg = loadConfig({}, kv);
  const SUPER = { role: "super", user: { id: "1", email: "joao@x.com" } };
  await handleSeed({ state: { positions: {}, customEpics: [], prioOrder: [], filaProdutoOrder: [], filaUxOrder: [] } }, SUPER, rcfg);
  const j = loadJiraConfig({ JIRA_EMAIL: "mock@local.test", JIRA_API_TOKEN: "mock-token", JIRA_BASE_URL: "https://mock.atlassian.net" }, createMockJiraFetch(ROWS));
  const r = await handleUpdateEpic({ key: "FLIX-1", status: "Pronto P/ DEV" }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  assert.equal((await handleGet(rcfg)).body.state.epicOverrides["FLIX-1"].status, "Pronto P/ DEV");
  assert.equal((await handleUpdateEpic({ key: "FLIX-1", status: "Cancelado" }, SUPER, rcfg, j)).status, 400);
});
