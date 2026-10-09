import { test } from "node:test";
import assert from "node:assert/strict";
import { createMemoryKv, handleGet, handleSeed, loadConfig } from "./roadmap-core.js";
import {
  PRODUCT_TO_PROJECT,
  descriptionToAdf,
  handleCancelEpic,
  handleCreateEpic,
  handleRenameEpic,
  handleStatus,
  loadJiraConfig,
} from "./jira-core.js";

const SUPER = { role: "super", user: { id: "1", email: "joao@x.com" } };
const ANDRE = { role: "admin", user: { id: "2", email: "andre@x.com" } };
const MARIA = { role: "admin", user: { id: "3", email: "maria@x.com" } };
const LEITOR = { role: "user", user: { id: "4", email: "leitor@x.com" } };

const TOKEN = "SEGREDO-123-do-token";
const JIRA_ENV = { JIRA_EMAIL: "bot@stl.com", JIRA_API_TOKEN: TOKEN, JIRA_BASE_URL: "https://stl.atlassian.net/" };

const epic = (key, createdBy, summary = "Rascunho") => ({ key, summary, createdBy, status: "Rascunho", epic: true, project: null });
const pos = (lane, startWeek, durationWeeks = 2) => ({ roadmapLane: lane, startWeek, durationWeeks });

/** Jira falso: guarda as issues e registra toda chamada (método, caminho, corpo, auth). */
function fakeJira(opts = {}) {
  const calls = [];
  const issues = new Map(Object.entries(opts.issues || {}));
  const counters = {};
  const epicType = { id: "10000", name: "Epic", hierarchyLevel: 1 };
  const storyType = { id: "10001", name: "Story", hierarchyLevel: 0 };
  const projects = new Set(opts.projects || ["SELLER", "IA", "FLIX", "LOJA", "BACK", "ACADEMY"]);
  const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, text: async () => (body === undefined ? "" : JSON.stringify(body)) });
  const defaultTransitions = [{ id: "11", name: "Em DEV", to: { name: "Em DEV" } }, { id: "21", name: "Cancelar", to: { name: "Cancelado" } }];

  const fetch = async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method || "GET";
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, path: u.pathname + u.search, body, auth: init.headers?.Authorization, host: u.host });
    if (opts.networkDown) throw new Error("ECONNREFUSED");
    let m;
    if (opts.forceStatus && opts.forceStatus.path.test(u.pathname) && opts.forceStatus.method === method) {
      return reply(opts.forceStatus.status, opts.forceStatus.body);
    }
    if (method === "GET" && (m = u.pathname.match(/^\/rest\/api\/3\/project\/([A-Z]+)$/))) {
      if (!projects.has(m[1])) return reply(404, { errorMessages: ["No project could be found"] });
      return reply(200, { issueTypes: opts.noEpicType ? [storyType] : [storyType, epicType] });
    }
    if (method === "GET" && (m = u.pathname.match(/^\/rest\/api\/3\/issue\/createmeta\/([A-Z]+)\/issuetypes\/(\d+)$/))) {
      if (!opts.createmeta) return reply(404, { errorMessages: ["createmeta indisponível"] });
      const start = Number(u.searchParams.get("startAt") || 0);
      const size = opts.pageSize || 100;
      const slice = opts.createmeta.slice(start, start + size);
      return reply(200, { values: slice, startAt: start, maxResults: size, total: opts.createmeta.length, isLast: start + size >= opts.createmeta.length });
    }
    if (method === "POST" && u.pathname === "/rest/api/3/issue") {
      const f = body.fields;
      if (opts.requireTipo) {
        const v = f[opts.requireTipo.field];
        const labels = opts.requireTipo.options;
        const okShape = v !== undefined && (opts.requireTipo.arrayOnly ? Array.isArray(v) : !Array.isArray(v));
        const first = Array.isArray(v) ? v[0] : v;
        const label = first && (first.value ?? labels[first.id]);
        if (!okShape || !label || !Object.values(labels).includes(label)) return reply(400, { errors: { [opts.requireTipo.field]: "Preencha o campo: Tipo de entrega" } });
      }
      if (opts.epicNameRequired && !f.customfield_10011) return reply(400, { errors: { customfield_10011: "Epic Name is required." } });
      if (opts.rejectDescription && f.description) return reply(400, { errors: { description: "Field 'description' cannot be set. It is not on the appropriate screen, or unknown." } });
      counters[f.project.key] = (counters[f.project.key] || 300) + 1;
      const key = `${f.project.key}-${counters[f.project.key]}`;
      issues.set(key, { summary: f.summary, status: "Backlog", type: epicType });
      return reply(201, { id: "9999", key });
    }
    if (method === "GET" && (m = u.pathname.match(/^\/rest\/api\/3\/issue\/([A-Z0-9]+-\d+)$/))) {
      const it = issues.get(m[1]);
      if (!it) return reply(404, { errorMessages: ["Issue does not exist"] });
      return reply(200, { key: m[1], fields: { summary: it.summary, status: { name: it.status }, issuetype: it.type } });
    }
    if (method === "GET" && (m = u.pathname.match(/^\/rest\/api\/3\/issue\/([A-Z0-9]+-\d+)\/editmeta$/))) {
      return reply(200, { fields: opts.editmetaFields || { summary: { name: "Summary" } } });
    }
    if (method === "PUT" && (m = u.pathname.match(/^\/rest\/api\/3\/issue\/([A-Z0-9]+-\d+)$/))) {
      if (opts.rejectEpicNamePut && body.fields.customfield_10011) return reply(400, { errors: { customfield_10011: "Field cannot be set." } });
      issues.get(m[1]).summary = body.fields.summary;
      return reply(204);
    }
    if (method === "GET" && (m = u.pathname.match(/^\/rest\/api\/3\/issue\/([A-Z0-9]+-\d+)\/transitions$/))) {
      return reply(200, { transitions: opts.transitions || defaultTransitions });
    }
    if (method === "POST" && (m = u.pathname.match(/^\/rest\/api\/3\/issue\/([A-Z0-9]+-\d+)\/transitions$/))) {
      const t = (opts.transitions || defaultTransitions).find((x) => x.id === body.transition.id);
      issues.get(m[1]).status = t.to.name;
      return reply(204);
    }
    return reply(500, { errorMessages: [`rota não prevista no teste: ${method} ${u.pathname}`] });
  };
  return { fetch, calls, issues, writes: () => calls.filter((c) => c.method !== "GET") };
}

const SEED = {
  state: {
    positions: { "SELLER-1": pos("STL Seller", 0), "NOVO-100": pos(null, null), "NOVO-200": pos(null, null), "FLIX-9": pos("STLFLIX", 2) },
    customEpics: [epic("NOVO-100", "joao@x.com", "Draft do João"), epic("NOVO-200", "andre@x.com", "Draft do André")],
    prioOrder: ["SELLER-1", "NOVO-100"],
    filaProdutoOrder: ["FLIX-9", "NOVO-200", "NOVO-100"],
    filaUxOrder: ["NOVO-200"],
  },
};

async function setup(jiraOpts) {
  const rcfg = loadConfig({}, createMemoryKv());
  assert.equal((await handleSeed(SEED, SUPER, rcfg)).status, 201);
  const jira = fakeJira(jiraOpts);
  const j = loadJiraConfig(JIRA_ENV, jira.fetch);
  return { rcfg, jira, j };
}
const state = async (rcfg) => (await handleGet(rcfg)).body;
const noLeak = (res) => {
  const text = JSON.stringify(res.body);
  assert.ok(!text.includes(TOKEN), "o token vazou na resposta");
  assert.ok(!text.includes(Buffer.from(`bot@stl.com:${TOKEN}`).toString("base64")), "o Authorization vazou na resposta");
};

/* --------------------------------- config --------------------------------- */

test("sem credenciais: integração desligada, 503 claro e zero chamadas de rede", async () => {
  const rcfg = loadConfig({}, createMemoryKv());
  const jira = fakeJira();
  const j = loadJiraConfig({}, jira.fetch);
  assert.deepEqual(j.missing, ["JIRA_EMAIL", "JIRA_API_TOKEN"]);
  assert.equal(handleStatus(j).body.configured, false);
  for (const r of [
    await handleCreateEpic({ key: "NOVO-1", summary: "x", product: "STL IA" }, SUPER, rcfg, j),
    await handleRenameEpic({ key: "IA-1", summary: "x" }, SUPER, rcfg, j),
    await handleCancelEpic({ key: "IA-1" }, SUPER, rcfg, j),
  ]) {
    assert.equal(r.status, 503);
    assert.match(r.body.message, /JIRA_EMAIL e JIRA_API_TOKEN/);
  }
  assert.equal(jira.calls.length, 0);
});

test("URL base precisa ser https e a barra final é ignorada; status diz 'configurado'", () => {
  assert.equal(loadJiraConfig({ ...JIRA_ENV, JIRA_BASE_URL: "http://inseguro.com" }).missing.length, 1);
  const j = loadJiraConfig(JIRA_ENV);
  assert.equal(j.baseUrl, "https://stl.atlassian.net");
  assert.equal(handleStatus(j).body.configured, true);
  assert.equal(loadJiraConfig({ JIRA_EMAIL: "a@b.c", JIRA_API_TOKEN: "t" }).baseUrl, "https://joaogonzalezstlflix.atlassian.net");
});

test("todo produto do Roadmap tem projeto no Jira", () => {
  assert.deepEqual(Object.keys(PRODUCT_TO_PROJECT).sort(), ["STL IA", "STL Loja", "STL Academy", "STL Seller", "STLFLIX", "Backoffice"].sort());
});

/* ---------------------------------- criar --------------------------------- */

test("criar: cria no projeto do produto, troca NOVO-x pela chave real em tudo e usa Basic auth", async () => {
  const { rcfg, jira, j } = await setup();
  const r = await handleCreateEpic({ key: "NOVO-100", summary: "  Meu   épico  novo ", product: "STL Seller", position: pos("STL Seller", 3, 2) }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  assert.equal(r.body.key, "SELLER-301");
  assert.equal(r.body.oldKey, "NOVO-100");
  noLeak(r);

  const post = jira.calls.find((c) => c.method === "POST" && c.path === "/rest/api/3/issue");
  assert.deepEqual(post.body.fields, { project: { key: "SELLER" }, issuetype: { id: "10000" }, summary: "Meu épico novo" });
  assert.equal(post.auth, `Basic ${Buffer.from(`bot@stl.com:${TOKEN}`).toString("base64")}`);
  assert.ok(jira.calls.every((c) => c.host === "stl.atlassian.net"));

  const s = (await state(rcfg)).state;
  const rec = s.customEpics.find((e) => e.key === "SELLER-301");
  assert.ok(rec, "registro custom ganhou a chave real");
  assert.equal(rec.project, "STL Seller");
  assert.equal(rec.summary, "Meu épico novo");
  assert.equal(rec.createdBy, "joao@x.com", "dono preservado");
  assert.equal(rec.status, "Backlog");
  assert.equal(s.customEpics.some((e) => e.key === "NOVO-100"), false);
  assert.deepEqual(s.positions["SELLER-301"], pos("STL Seller", 3, 2));
  assert.equal("NOVO-100" in s.positions, false);
  assert.deepEqual(s.prioOrder, ["SELLER-1", "SELLER-301"], "troca no mesmo lugar da fila");
  assert.deepEqual(s.filaProdutoOrder, ["FLIX-9", "NOVO-200", "SELLER-301"]);
});

test("criar: admin cria só o próprio rascunho; o de outra pessoa não chega ao Jira", async () => {
  const { rcfg, jira, j } = await setup();
  const outro = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, ANDRE, rcfg, j);
  assert.equal(outro.status, 403);
  const proprio = await handleCreateEpic({ key: "NOVO-200", summary: "Do André", product: "STL IA" }, ANDRE, rcfg, j);
  assert.equal(proprio.status, 200);
  assert.equal(proprio.body.key, "IA-301");
  assert.equal(jira.writes().length, 1, "só a criação legítima escreveu no Jira");
  assert.equal((await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, LEITOR, rcfg, j)).status, 403);
  assert.equal((await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, null, rcfg, j)).status, 403);
});

test("criar: validações recusam antes de falar com o Jira", async () => {
  const { rcfg, jira, j } = await setup();
  const casos = [
    [{ key: "SELLER-9", summary: "x", product: "STL IA" }, 400],                       // não é rascunho
    [{ key: "NOVO-100", summary: "   ", product: "STL IA" }, 400],                     // nome vazio
    [{ key: "NOVO-100", summary: "x".repeat(256), product: "STL IA" }, 400],           // nome longo
    [{ key: "NOVO-100", summary: "x", product: "Produto Inventado" }, 400],            // produto
    [{ key: "NOVO-100", summary: "x", product: "STL IA", position: pos("STL Seller", 0) }, 400], // camada ≠ produto
    [{ key: "NOVO-100", summary: "x", product: "STL IA", position: { roadmapLane: "STL IA", startWeek: "1", durationWeeks: 2 } }, 400],
    [{ key: "NOVO-999", summary: "x", product: "STL IA" }, 404],                       // não existe
    [{ summary: "x", product: "STL IA" }, 400],
  ];
  for (const [input, status] of casos) {
    const r = await handleCreateEpic(input, SUPER, rcfg, j);
    assert.equal(r.status, status, JSON.stringify(input).slice(0, 80));
  }
  assert.equal(jira.calls.length, 0);
});

test("criar: projeto que exige 'Epic Name' — acha o campo no erro do Jira e tenta de novo", async () => {
  const { rcfg, jira, j } = await setup({ epicNameRequired: true });
  const r = await handleCreateEpic({ key: "NOVO-100", summary: "Com epic name", product: "STLFLIX" }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  assert.equal(r.body.key, "FLIX-301");
  const posts = jira.calls.filter((c) => c.method === "POST" && c.path === "/rest/api/3/issue");
  assert.equal(posts.length, 2);
  assert.equal(posts[1].body.fields.customfield_10011, "Com epic name");
});

test("criar: se o Jira recusa, o Roadmap não muda e a mensagem é clara (sem vazar token)", async () => {
  for (const [force, status, re] of [
    [{ status: 401, body: {} }, 502, /credenciais/],
    [{ status: 403, body: { errorMessages: ["You do not have permission to create issues"] } }, 403, /permissão/],
    [{ status: 400, body: { errors: { summary: "Summary is invalid" } } }, 400, /Summary is invalid/],
  ]) {
    const { rcfg, j } = await setup({ forceStatus: { path: /\/rest\/api\/3\/issue$/, method: "POST", ...force } });
    const before = await state(rcfg);
    const r = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, SUPER, rcfg, j);
    assert.equal(r.status, status);
    assert.match(r.body.message, re);
    noLeak(r);
    assert.deepEqual((await state(rcfg)).state, before.state);
    assert.equal((await state(rcfg)).rev, before.rev);
  }
  const { rcfg, j } = await setup({ networkDown: true });
  const down = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, SUPER, rcfg, j);
  assert.equal(down.status, 502);
  assert.match(down.body.message, /Não consegui falar com o Jira/);
});

test("criar: projeto sem tipo Épico e projeto inexistente dão erro claro", async () => {
  let { rcfg, j } = await setup({ noEpicType: true });
  let r = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, SUPER, rcfg, j);
  assert.equal(r.status, 409);
  assert.match(r.body.message, /tipo "Épico"/);
  ({ rcfg, j } = await setup({ projects: ["SELLER"] }));
  r = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, SUPER, rcfg, j);
  assert.equal(r.status, 404);
});

test("criar: segunda chamada com a chave antiga não duplica no Jira", async () => {
  const { rcfg, jira, j } = await setup();
  assert.equal((await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, SUPER, rcfg, j)).status, 200);
  const again = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, SUPER, rcfg, j);
  assert.equal(again.status, 404);
  assert.equal(jira.calls.filter((c) => c.method === "POST").length, 1);
});

test("criar: escrita concorrente no Roadmap durante a criação não se perde", async () => {
  const { rcfg, j } = await setup();
  let injected = false;
  const realEval = rcfg.kv.eval.bind(rcfg.kv);
  rcfg.kv.eval = async (script, args) => {
    if (!injected) {
      injected = true;
      const { handlePatch } = await import("./roadmap-core.js");
      await handlePatch({ positions: { "FLIX-9": pos("STLFLIX", 7) } }, SUPER, rcfg);
    }
    return realEval(script, args);
  };
  const r = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL Seller" }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  const s = (await state(rcfg)).state;
  assert.equal(s.positions["FLIX-9"].startWeek, 7, "a mudança concorrente foi preservada");
  assert.ok(s.customEpics.some((e) => e.key === "SELLER-301"));
});

/* -------------------------------- renomear -------------------------------- */

const withEpics = (extra = {}) => ({
  issues: {
    "SELLER-1": { summary: "Nome antigo", status: "Em DEV", type: { id: "10000", name: "Epic", hierarchyLevel: 1 } },
    "IA-5": { summary: "Épico do André", status: "Backlog", type: { id: "10000", name: "Epic", hierarchyLevel: 1 } },
    "SELLER-77": { summary: "Uma história", status: "Em DEV", type: { id: "10001", name: "Story", hierarchyLevel: 0 } },
    ...extra,
  },
});

test("renomear: super renomeia épico da planilha no Jira e o Roadmap passa a mostrar o nome novo", async () => {
  const { rcfg, jira, j } = await setup(withEpics());
  const r = await handleRenameEpic({ key: "SELLER-1", summary: "  Nome   NOVO " }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  noLeak(r);
  const put = jira.calls.find((c) => c.method === "PUT");
  assert.equal(put.path, "/rest/api/3/issue/SELLER-1");
  assert.deepEqual(put.body, { fields: { summary: "Nome NOVO" } });
  assert.equal(jira.issues.get("SELLER-1").summary, "Nome NOVO");
  assert.equal((await state(rcfg)).state.epicOverrides["SELLER-1"].summary, "Nome NOVO");
});

test("renomear: projeto com 'Epic Name' atualiza os dois campos; se o Jira recusar o campo, cai pro resumo", async () => {
  let { rcfg, jira, j } = await setup({ ...withEpics(), editmetaFields: { summary: { name: "Summary" }, customfield_10011: { name: "Epic Name" } } });
  assert.equal((await handleRenameEpic({ key: "SELLER-1", summary: "Novo" }, SUPER, rcfg, j)).status, 200);
  assert.deepEqual(jira.calls.find((c) => c.method === "PUT").body.fields, { summary: "Novo", customfield_10011: "Novo" });

  ({ rcfg, jira, j } = await setup({ ...withEpics(), editmetaFields: { customfield_10011: { name: "Epic Name" } }, rejectEpicNamePut: true }));
  assert.equal((await handleRenameEpic({ key: "SELLER-1", summary: "Novo" }, SUPER, rcfg, j)).status, 200);
  const puts = jira.calls.filter((c) => c.method === "PUT");
  assert.equal(puts.length, 2);
  assert.deepEqual(puts[1].body.fields, { summary: "Novo" });
});

test("renomear: nome igual ao do Jira não gera escrita no Jira", async () => {
  const { rcfg, jira, j } = await setup(withEpics());
  assert.equal((await handleRenameEpic({ key: "SELLER-1", summary: "Nome antigo" }, SUPER, rcfg, j)).status, 200);
  assert.equal(jira.writes().length, 0);
});

test("renomear: admin só os próprios (registro com o e-mail dele); nada vai ao Jira quando negado", async () => {
  const { rcfg, jira, j } = await setup(withEpics());
  // André cria o dele no Jira (vira IA-301 com a chave real)…
  const created = await handleCreateEpic({ key: "NOVO-200", summary: "Do André", product: "STL IA" }, ANDRE, rcfg, j);
  assert.equal(created.body.key, "IA-301");
  const writesBefore = jira.writes().length;
  // …e renomeia o dele
  const ok = await handleRenameEpic({ key: "IA-301", summary: "Do André v2" }, ANDRE, rcfg, j);
  assert.equal(ok.status, 200);
  const s = (await state(rcfg)).state;
  assert.equal(s.customEpics.find((e) => e.key === "IA-301").summary, "Do André v2");
  assert.equal(s.epicOverrides["IA-301"].summary, "Do André v2");
  // não renomeia épico da planilha nem o de outra pessoa
  const before = jira.writes().length;
  assert.equal((await handleRenameEpic({ key: "SELLER-1", summary: "x" }, ANDRE, rcfg, j)).status, 403);
  assert.equal((await handleRenameEpic({ key: "IA-301", summary: "roubado" }, MARIA, rcfg, j)).status, 403);
  assert.equal((await handleRenameEpic({ key: "IA-301", summary: "x" }, LEITOR, rcfg, j)).status, 403);
  assert.equal(jira.writes().length, before);
  assert.ok(writesBefore >= 1);
});

test("renomear: só épico — história/tarefa e chaves malformadas são recusadas", async () => {
  const { rcfg, jira, j } = await setup(withEpics());
  const story = await handleRenameEpic({ key: "SELLER-77", summary: "x" }, SUPER, rcfg, j);
  assert.equal(story.status, 409);
  assert.match(story.body.message, /não é um épico/);
  for (const key of ["NOVO-100", "seller-1", "SELLER-1/../../x", "SELLER-", "", null, "SELLER-1?x=1"]) {
    assert.equal((await handleRenameEpic({ key, summary: "x" }, SUPER, rcfg, j)).status, 400, String(key));
  }
  assert.equal((await handleRenameEpic({ key: "SELLER-1", summary: "" }, SUPER, rcfg, j)).status, 400);
  assert.equal(jira.writes().length, 0);
  assert.equal((await handleRenameEpic({ key: "SELLER-999", summary: "x" }, SUPER, rcfg, j)).status, 404);
});

/* -------------------------------- cancelar -------------------------------- */

test("cancelar: move para Cancelado (nunca exclui), limpa posições/filas e esconde a versão da planilha", async () => {
  const { rcfg, jira, j } = await setup(withEpics());
  // SELLER-1 está posicionado e numa fila
  const { handlePatch } = await import("./roadmap-core.js");
  await handlePatch({ filaUxOrder: { add: ["SELLER-1"] } }, SUPER, rcfg);
  const r = await handleCancelEpic({ key: "SELLER-1" }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  noLeak(r);
  assert.equal(jira.issues.get("SELLER-1").status, "Cancelado");
  assert.ok(jira.calls.every((c) => c.method !== "DELETE"), "nunca usa a API de exclusão");
  const tr = jira.calls.find((c) => c.method === "POST" && c.path.endsWith("/transitions"));
  assert.deepEqual(tr.body, { transition: { id: "21" } });
  const s = (await state(rcfg)).state;
  assert.equal("SELLER-1" in s.positions, false);
  assert.equal(s.prioOrder.includes("SELLER-1"), false);
  assert.equal(s.filaUxOrder.includes("SELLER-1"), false);
  assert.equal(s.epicOverrides["SELLER-1"].removed, true);
});

test("cancelar: prefere 'Cancelado' a 'Arquivado'; aceita 'Arquivado' se for o único; já cancelado é idempotente", async () => {
  let { rcfg, jira, j } = await setup({ ...withEpics(), transitions: [{ id: "31", name: "Arquivar", to: { name: "Arquivado" } }, { id: "21", name: "Cancelar", to: { name: "Cancelado" } }] });
  await handleCancelEpic({ key: "SELLER-1" }, SUPER, rcfg, j);
  assert.equal(jira.issues.get("SELLER-1").status, "Cancelado");

  ({ rcfg, jira, j } = await setup({ ...withEpics(), transitions: [{ id: "31", name: "Arquivar", to: { name: "Arquivado" } }] }));
  await handleCancelEpic({ key: "SELLER-1" }, SUPER, rcfg, j);
  assert.equal(jira.issues.get("SELLER-1").status, "Arquivado");

  ({ rcfg, jira, j } = await setup(withEpics({ "SELLER-1": { summary: "x", status: "Cancelado", type: { id: "10000", name: "Epic", hierarchyLevel: 1 } } })));
  const r = await handleCancelEpic({ key: "SELLER-1" }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  assert.equal(jira.writes().length, 0, "já cancelado: nenhuma transição");
});

test("cancelar: sem transição possível, recusa listando as opções e não mexe no Roadmap", async () => {
  const { rcfg, jira, j } = await setup({ ...withEpics(), transitions: [{ id: "11", name: "Em DEV", to: { name: "Em DEV" } }] });
  const before = await state(rcfg);
  const r = await handleCancelEpic({ key: "SELLER-1" }, SUPER, rcfg, j);
  assert.equal(r.status, 409);
  assert.match(r.body.message, /Em DEV/);
  assert.equal(jira.writes().length, 0);
  assert.equal((await state(rcfg)).rev, before.rev);
});

test("cancelar: admin cancela só o próprio (já criado no Jira); remove o registro daqui", async () => {
  const { rcfg, jira, j } = await setup(withEpics());
  const created = await handleCreateEpic({ key: "NOVO-200", summary: "Do André", product: "STL IA" }, ANDRE, rcfg, j);
  const key = created.body.key;
  assert.equal((await handleCancelEpic({ key }, MARIA, rcfg, j)).status, 403);
  assert.equal((await handleCancelEpic({ key: "SELLER-1" }, ANDRE, rcfg, j)).status, 403);
  assert.equal(jira.issues.get(key).status, "Backlog", "negado: nada mudou no Jira");
  const ok = await handleCancelEpic({ key }, ANDRE, rcfg, j);
  assert.equal(ok.status, 200);
  assert.equal(jira.issues.get(key).status, "Cancelado");
  const s = (await state(rcfg)).state;
  assert.equal(s.customEpics.some((e) => e.key === key), false);
  assert.equal(s.filaProdutoOrder.includes(key), false);
  assert.equal(s.epicOverrides[key].removed, true);
});

/* ------------------------------ descrição (novo) ------------------------------ */

test("descriptionToAdf: parágrafos, quebras de linha e texto vazio válidos pro Jira", () => {
  assert.deepEqual(descriptionToAdf("Uma linha"), { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: "Uma linha" }] }] });
  const doc = descriptionToAdf("Linha 1\nLinha 2\n\n\nSegundo parágrafo\r\ncom quebra");
  assert.equal(doc.content.length, 2);
  assert.deepEqual(doc.content[0].content, [{ type: "text", text: "Linha 1" }, { type: "hardBreak" }, { type: "text", text: "Linha 2" }]);
  assert.deepEqual(doc.content[1].content, [{ type: "text", text: "Segundo parágrafo" }, { type: "hardBreak" }, { type: "text", text: "com quebra" }]);
  // o ADF não aceita nó de texto vazio
  const json = JSON.stringify(descriptionToAdf("a\n\n\n   \n\nb\n"));
  assert.ok(!json.includes('"text":""'));
});

test("criar com descrição: vai ao Jira em ADF, fica salva no épico e aparece como resumo", async () => {
  const { rcfg, jira, j } = await setup();
  const r = await handleCreateEpic({ key: "NOVO-100", summary: "Com descrição", product: "STL IA", description: "  Contexto do épico.\n\nSegundo parágrafo.  " }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  assert.equal(r.body.warning, undefined);
  const post = jira.calls.find((c) => c.method === "POST" && c.path === "/rest/api/3/issue");
  assert.deepEqual(post.body.fields.description, descriptionToAdf("Contexto do épico.\n\nSegundo parágrafo."));
  const rec = (await state(rcfg)).state.customEpics.find((e) => e.key === "IA-301");
  assert.equal(rec.resumo, "Contexto do épico.\n\nSegundo parágrafo.");
});

test("criar sem descrição: não manda o campo ao Jira", async () => {
  const { rcfg, jira, j } = await setup();
  await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA", description: "   " }, SUPER, rcfg, j);
  const post = jira.calls.find((c) => c.method === "POST" && c.path === "/rest/api/3/issue");
  assert.equal("description" in post.body.fields, false);
  assert.equal((await state(rcfg)).state.customEpics.find((e) => e.key === "IA-301").resumo, null);
});

test("criar: descrição inválida (não-texto ou enorme) é recusada antes do Jira", async () => {
  const { rcfg, jira, j } = await setup();
  assert.equal((await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA", description: { a: 1 } }, SUPER, rcfg, j)).status, 400);
  assert.equal((await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA", description: "a".repeat(10001) }, SUPER, rcfg, j)).status, 400);
  assert.equal(jira.calls.length, 0);
});

test("criar: Jira não aceita 'description' na tela do projeto -> cria sem ela, avisa e guarda aqui", async () => {
  const { rcfg, jira, j } = await setup({ rejectDescription: true });
  const r = await handleCreateEpic({ key: "NOVO-100", summary: "Sem tela de descrição", product: "STLFLIX", description: "Texto importante" }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  assert.equal(r.body.key, "FLIX-301");
  assert.match(r.body.warning, /FLIX-301.*não aceitou a descrição/);
  assert.equal(jira.calls.filter((c) => c.method === "POST" && c.path === "/rest/api/3/issue").length, 2, "tentou com e sem descrição");
  assert.equal((await state(rcfg)).state.customEpics.find((e) => e.key === "FLIX-301").resumo, "Texto importante");
});

test("criar: 'Epic Name' obrigatório + descrição recusada juntos — resolve os dois", async () => {
  const { rcfg, jira, j } = await setup({ epicNameRequired: true, rejectDescription: true });
  const r = await handleCreateEpic({ key: "NOVO-100", summary: "Duplo", product: "STL Loja", description: "d" }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  const last = jira.calls.filter((c) => c.method === "POST" && c.path === "/rest/api/3/issue").pop();
  assert.equal(last.body.fields.customfield_10011, "Duplo");
  assert.equal("description" in last.body.fields, false);
});

test("criar com Projeto e camada 'Para priorização' (sem posição no Gantt): cria no projeto e continua na priorização", async () => {
  const { rcfg, jira, j } = await setup();
  const r = await handleCreateEpic({ key: "NOVO-100", summary: "Só no projeto", product: "STL Seller", position: { roadmapLane: null, startWeek: null, durationWeeks: 2 } }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  assert.equal(jira.calls.find((c) => c.method === "POST" && c.path === "/rest/api/3/issue").body.fields.project.key, "SELLER");
  const s = (await state(rcfg)).state;
  assert.deepEqual(s.positions["SELLER-301"], { roadmapLane: null, startWeek: null, durationWeeks: 2 });
  assert.equal(s.customEpics.find((e) => e.key === "SELLER-301").project, "STL Seller");
});

test("rascunho: projeto e descrição persistem no Roadmap (resumo) e não se perdem num PATCH", async () => {
  const { rcfg } = await setup();
  const { handlePatch } = await import("./roadmap-core.js");
  const r = await handlePatch({ customEpics: { upsert: [{ key: "NOVO-100", summary: "Rascunho", project: "STL IA", resumo: "Minha descrição", createdBy: "joao@x.com" }] } }, SUPER, rcfg);
  assert.equal(r.status, 200);
  const rec = r.body.state.customEpics.find((e) => e.key === "NOVO-100");
  assert.equal(rec.project, "STL IA");
  assert.equal(rec.resumo, "Minha descrição");
  assert.equal((await handlePatch({ customEpics: { upsert: [{ key: "NOVO-100", summary: "x", resumo: "a".repeat(10001), createdBy: "joao@x.com" }] } }, SUPER, rcfg)).body.state.customEpics.find((e) => e.key === "NOVO-100").resumo.length, 10000, "descrição enorme é cortada, não derruba o save");
});

/* ------------------------------ Tipo de entrega ------------------------------ */

const TIPO_FIELD = (extra = {}) => ({
  fieldId: "customfield_10050", name: "Tipo de entrega", required: true, schema: { type: "option" },
  allowedValues: [{ id: "10101", value: "Inovação" }, { id: "10102", value: "Melhoria" }, { id: "10103", value: "Sustentação" }],
  ...extra,
});
const BASE_FIELDS = [{ fieldId: "summary", name: "Resumo", required: true }, { fieldId: "description", name: "Descrição", required: false }];

test("tipo de entrega: o campo é descoberto no projeto e enviado com o id da opção", async () => {
  const { rcfg, jira, j } = await setup({ createmeta: [...BASE_FIELDS, TIPO_FIELD()], requireTipo: { field: "customfield_10050", options: { 10101: "Inovação", 10102: "Melhoria", 10103: "Sustentação" } } });
  const r = await handleCreateEpic({ key: "NOVO-100", summary: "Com tipo", product: "STL IA", tipo: "Melhoria" }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  const post = jira.calls.find((c) => c.method === "POST" && c.path === "/rest/api/3/issue");
  assert.deepEqual(post.body.fields.customfield_10050, { id: "10102" });
  assert.equal(jira.calls.filter((c) => c.method === "POST" && c.path === "/rest/api/3/issue").length, 1, "acertou de primeira, sem retry");
  assert.equal((await state(rcfg)).state.customEpics.find((e) => e.key === "IA-301").tipo, "Melhoria");
});

test("tipo de entrega: ignora maiúsculas/acentos e aceita campo de lista múltipla", async () => {
  const { rcfg, jira, j } = await setup({ createmeta: [TIPO_FIELD({ schema: { type: "array", items: "option" } })], requireTipo: { field: "customfield_10050", arrayOnly: true, options: { 10101: "Inovação", 10102: "Melhoria", 10103: "Sustentação" } } });
  const r = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL Seller", tipo: "sustentacao" }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  assert.deepEqual(jira.calls.find((c) => c.method === "POST" && c.path === "/rest/api/3/issue").body.fields.customfield_10050, [{ id: "10103" }]);
  assert.equal((await state(rcfg)).state.customEpics.find((e) => e.key === "SELLER-301").tipo, "Sustentação", "guarda o nome canônico");
});

test("tipo de entrega obrigatório e não escolhido: recusa ANTES de criar, dizendo as opções", async () => {
  const { rcfg, jira, j } = await setup({ createmeta: [TIPO_FIELD()] });
  const r = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, SUPER, rcfg, j);
  assert.equal(r.status, 400);
  assert.match(r.body.message, /exige o Tipo de entrega.*Inovação, Melhoria, Sustentação/);
  assert.equal(jira.writes().length, 0, "nada foi criado no Jira");
});

test("tipo de entrega: opção que o Jira não tem e valor inválido do app", async () => {
  const { rcfg, jira, j } = await setup({ createmeta: [TIPO_FIELD({ allowedValues: [{ id: "1", value: "Inovação" }] })] });
  const sem = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA", tipo: "Melhoria" }, SUPER, rcfg, j);
  assert.equal(sem.status, 400);
  assert.match(sem.body.message, /não tem a opção "Melhoria".*Inovação/);
  assert.equal((await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA", tipo: "Qualquer coisa" }, SUPER, rcfg, j)).status, 400);
  assert.equal((await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA", tipo: 7 }, SUPER, rcfg, j)).status, 400);
  assert.equal(jira.writes().length, 0);
});

test("tipo de entrega: projeto sem o campo, ou campo opcional não escolhido — cria normalmente", async () => {
  let { rcfg, jira, j } = await setup({ createmeta: BASE_FIELDS });
  assert.equal((await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA", tipo: "Inovação" }, SUPER, rcfg, j)).status, 200);
  assert.ok(!Object.keys(jira.calls.find((c) => c.method === "POST" && c.path === "/rest/api/3/issue").body.fields).some((k) => k.startsWith("customfield")), "não inventa campo que o projeto não tem");
  ({ rcfg, jira, j } = await setup({ createmeta: [TIPO_FIELD({ required: false })] }));
  assert.equal((await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, SUPER, rcfg, j)).status, 200);
});

test("tipo de entrega: campo na segunda página do createmeta também é achado", async () => {
  const filler = Array.from({ length: 5 }, (_, i) => ({ fieldId: `customfield_2000${i}`, name: `Outro ${i}`, required: false }));
  const { rcfg, jira, j } = await setup({ createmeta: [...filler, TIPO_FIELD()], pageSize: 3, requireTipo: { field: "customfield_10050", options: { 10101: "Inovação", 10102: "Melhoria", 10103: "Sustentação" } } });
  assert.equal((await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA", tipo: "Inovação" }, SUPER, rcfg, j)).status, 200);
  assert.ok(jira.calls.filter((c) => c.path.includes("/createmeta/")).length >= 2, "paginou");
});

test("tipo de entrega: sem createmeta, o erro do Jira guia — tenta {value} e depois [{value}]", async () => {
  // lista simples: aceita {value}
  let { rcfg, jira, j } = await setup({ requireTipo: { field: "customfield_10050", options: { a: "Inovação", b: "Melhoria", c: "Sustentação" } } });
  let r = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA", tipo: "Inovação" }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  const posts = jira.calls.filter((c) => c.method === "POST" && c.path === "/rest/api/3/issue");
  assert.equal(posts.length, 2);
  assert.deepEqual(posts[1].body.fields.customfield_10050, { value: "Inovação" });
  // lista múltipla: precisa de [{value}]
  ({ rcfg, jira, j } = await setup({ requireTipo: { field: "customfield_10050", arrayOnly: true, options: { a: "Inovação", b: "Melhoria", c: "Sustentação" } } }));
  r = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA", tipo: "Melhoria" }, SUPER, rcfg, j);
  assert.equal(r.status, 200);
  assert.deepEqual(jira.calls.filter((c) => c.method === "POST" && c.path === "/rest/api/3/issue").pop().body.fields.customfield_10050, [{ value: "Melhoria" }]);
});

test("tipo de entrega: sem createmeta e sem escolher, o Jira exige — mensagem clara com as opções", async () => {
  const { rcfg, j } = await setup({ requireTipo: { field: "customfield_10050", options: { a: "Inovação" } } });
  const r = await handleCreateEpic({ key: "NOVO-100", summary: "x", product: "STL IA" }, SUPER, rcfg, j);
  assert.equal(r.status, 400);
  assert.match(r.body.message, /exige o Tipo de entrega.*Inovação, Melhoria, Sustentação/);
});
