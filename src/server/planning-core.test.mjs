import { test } from "node:test";
import assert from "node:assert/strict";
import { applyFields, mondayOf, handleCreate, handleDelete, handleList, handleUpdate } from "./planning-core.js";

const ADMIN = { role: "admin", user: { id: "1", email: "ana@x.com" } };
const LEITOR = { role: "user", user: { id: "2", email: "leitor@x.com" } };

function fakeConfig() {
  const data = new Map();
  return {
    kv: {
      connect: async () => {},
      get: async (k) => data.get(k) ?? null,
      set: async (k, v, opts) => {
        if (opts && opts.NX && data.has(k)) return null;
        data.set(k, v);
        return "OK";
      },
      del: async (k) => (data.delete(k) ? 1 : 0),
    },
    kvReady: null,
  };
}

async function tree(config) {
  const obj = (await handleCreate("objectives", { name: "Engajamento na Flix", product: "STLFLIX", startDate: "2026-10-01", endDate: "2026-12-31" }, ADMIN, config)).body;
  const kr = (await handleCreate("keyResults", { name: "DAU/MAU", objectiveId: obj.id, unit: "%", baseline: 20, target: 30 }, ADMIN, config)).body;
  const opp = (await handleCreate("opportunities", { name: "Usuário não acha o que baixar", keyResultId: kr.id }, ADMIN, config)).body;
  return { obj, kr, opp };
}

test("kind desconhecido ou herdado do protótipo é recusado", async () => {
  const config = fakeConfig();
  for (const kind of ["nope", "constructor", "__proto__", undefined, "releases", "initiatives"]) {
    assert.equal((await handleList(kind, config)).status, 400, String(kind));
  }
  assert.equal((await handleCreate("nope", { name: "x" }, ADMIN, config)).status, 400);
  assert.equal((await handleUpdate("nope", "id", {}, ADMIN, config)).status, 400);
  assert.equal((await handleDelete("nope", "id", ADMIN, config)).status, 400);
});

test("só admin ou super escrevem; leitura é aberta", async () => {
  const config = fakeConfig();
  assert.equal((await handleCreate("objectives", { name: "x" }, LEITOR, config)).status, 403);
  assert.equal((await handleCreate("objectives", { name: "x" }, null, config)).status, 403);
  assert.equal((await handleList("objectives", config)).status, 200);
});

test("cria com padrões do tipo e exige nome", async () => {
  const config = fakeConfig();
  assert.equal((await handleCreate("objectives", { name: "  " }, ADMIN, config)).status, 400);
  assert.equal((await handleCreate("objectives", { name: "Sem produto" }, ADMIN, config)).status, 400);
  const r = await handleCreate("objectives", { name: " Engajamento ", product: "STLFLIX", startDate: "2026-10-01", endDate: "31/12/2026" }, ADMIN, config);
  assert.equal(r.status, 201);
  assert.equal(r.body.name, "Engajamento");
  assert.equal(r.body.product, "STLFLIX");
  assert.equal(r.body.startDate, "2026-10-01");
  assert.equal(r.body.endDate, "");
  assert.equal(r.body.status, "Em andamento");
  assert.equal(r.body.createdBy, "ana@x.com");
});

test("filho exige o pai: KR, oportunidade, experimento e feature", async () => {
  const config = fakeConfig();
  assert.equal((await handleCreate("keyResults", { name: "KR" }, ADMIN, config)).status, 400);
  assert.equal((await handleCreate("opportunities", { name: "O" }, ADMIN, config)).status, 400);
  assert.equal((await handleCreate("experiments", { name: "E" }, ADMIN, config)).status, 400);
  assert.equal((await handleCreate("features", { name: "Calculadora" }, ADMIN, config)).status, 400);
  const f = await handleCreate("features", { name: "Calculadora", product: "STL Seller", epicKeys: ["SELLER-1", "SELLER-1"] }, ADMIN, config);
  assert.equal(f.status, 201);
  assert.deepEqual(f.body.epicKeys, ["SELLER-1"]);
});

test("KR guarda números, aceita vírgula e limpa com vazio", async () => {
  const config = fakeConfig();
  const { kr } = await tree(config);
  assert.equal(kr.baseline, 20);
  assert.equal(kr.current, null);
  const u = await handleUpdate("keyResults", kr.id, { current: "24,5", target: "abc", dueDate: "2026-12-31" }, ADMIN, config);
  assert.equal(u.body.current, 24.5);
  assert.equal(u.body.target, 30);
  assert.equal(u.body.dueDate, "2026-12-31");
  assert.equal((await handleUpdate("keyResults", kr.id, { current: "" }, ADMIN, config)).body.current, null);
});

test("experimento: ICE de 1 a 10, status e resultado validados, épico vinculado", async () => {
  const config = fakeConfig();
  const { opp } = await tree(config);
  const e = (await handleCreate("experiments", {
    name: "Onboarding com 3 STLs sugeridos", opportunityId: opp.id, hypothesis: "Se sugerirmos…",
    impact: 8, confidence: "6", ease: 11, status: "Rodando", outcome: "Talvez", dueDate: "2026-11-15", epicKey: "FLIX-9",
  }, ADMIN, config)).body;
  assert.equal(e.impact, 8);
  assert.equal(e.confidence, 6);
  assert.equal(e.ease, null);
  assert.equal(e.status, "Rodando");
  assert.equal(e.outcome, "");
  assert.equal(e.epicKey, "FLIX-9");
  const done = await handleUpdate("experiments", e.id, { status: "Concluído", outcome: "Validado", result: 27 }, ADMIN, config);
  assert.equal(done.body.outcome, "Validado");
  assert.equal(done.body.result, 27);
});

test("update não troca nome nem pai obrigatório por vazio", () => {
  const base = { id: "a", name: "Nome", objectiveId: "obj_1" };
  const next = applyFields("keyResults", base, { name: " ", objectiveId: "", hypothesis: "não é campo de KR" });
  assert.equal(next.name, "Nome");
  assert.equal(next.objectiveId, "obj_1");
  assert.equal("hypothesis" in next, false);
});

test("pai com filhos não é apagado; sem filhos, sai", async () => {
  const config = fakeConfig();
  const { obj, kr, opp } = await tree(config);
  const sub = (await handleCreate("opportunities", { name: "Sub", keyResultId: kr.id, parentId: opp.id }, ADMIN, config)).body;

  assert.equal((await handleDelete("objectives", obj.id, ADMIN, config)).status, 409);
  assert.equal((await handleDelete("keyResults", kr.id, ADMIN, config)).status, 409);
  assert.equal((await handleDelete("opportunities", opp.id, ADMIN, config)).status, 409);

  assert.equal((await handleDelete("opportunities", sub.id, ADMIN, config)).status, 200);
  assert.equal((await handleDelete("opportunities", opp.id, ADMIN, config)).status, 200);
  assert.equal((await handleDelete("keyResults", kr.id, ADMIN, config)).status, 200);
  assert.equal((await handleDelete("objectives", obj.id, ADMIN, config)).status, 200);
  assert.equal((await handleDelete("objectives", obj.id, ADMIN, config)).status, 404);
});

test("objetivo antigo (com epicKeys) continua legível e editável", async () => {
  const config = fakeConfig();
  await config.kv.set("jira:objectives", JSON.stringify([{ id: "obj_old", name: "Antigo", status: "Em andamento", epicKeys: ["X-1"] }]));
  const u = await handleUpdate("objectives", "obj_old", { period: "2026-T4" }, ADMIN, config);
  assert.equal(u.status, 200);
  assert.equal(u.body.period, "2026-T4");
});

test("mondayOf leva qualquer dia para a segunda-feira da semana", () => {
  assert.equal(mondayOf("2026-10-27"), "2026-10-26"); // terça
  assert.equal(mondayOf("2026-10-26"), "2026-10-26"); // segunda
  assert.equal(mondayOf("2026-11-01"), "2026-10-26"); // domingo
  assert.equal(mondayOf("27/10/2026"), null);
});

test("check-ins semanais: um por semana, ordenados, e o último vira o valor atual", async () => {
  const config = fakeConfig();
  const { kr, opp } = await tree(config);
  const u = await handleUpdate("keyResults", kr.id, { checkins: [
    { week: "2026-10-28", value: "23", note: " subiu " },
    { week: "2026-10-12", value: 21 },
    { week: "2026-10-26", value: 24, note: "corrigido" }, // mesma semana do primeiro: vale este
    { week: "x", value: 1 },
    { week: "2026-10-19", value: "abc" },
  ] }, ADMIN, config);
  assert.deepEqual(u.body.checkins, [
    { week: "2026-10-12", value: 21, note: "" },
    { week: "2026-10-26", value: 24, note: "corrigido" },
  ]);
  assert.equal(u.body.current, 24);

  const x = (await handleCreate("experiments", { name: "E", opportunityId: opp.id, checkins: [{ week: "2026-10-26", value: 38 }] }, ADMIN, config)).body;
  assert.equal(x.result, 38);
  assert.equal((await handleUpdate("experiments", x.id, { checkins: [] }, ADMIN, config)).body.result, 38);
});

test("um épico fica numa feature só: vincular numa tira da outra", async () => {
  const config = fakeConfig();
  const a = (await handleCreate("features", { name: "Calculadora", product: "STL Seller", epicKeys: ["SELLER-42", "SELLER-155"] }, ADMIN, config)).body;
  const b = (await handleCreate("features", { name: "Finder", product: "STL Seller", epicKeys: ["SELLER-42"] }, ADMIN, config)).body;
  let list = (await handleList("features", config)).body;
  assert.deepEqual(list.find((f) => f.id === a.id).epicKeys, ["SELLER-155"]);
  await handleUpdate("features", a.id, { epicKeys: ["SELLER-155", "SELLER-42"] }, ADMIN, config);
  list = (await handleList("features", config)).body;
  assert.deepEqual(list.map((f) => f.id), [a.id, b.id]); // ordem preservada
  assert.deepEqual(list.find((f) => f.id === b.id).epicKeys, []);
});

test("oportunidade guarda links: só http(s), sem repetir, rótulo padrão = domínio", async () => {
  const config = fakeConfig();
  const { kr } = await tree(config);
  const o = (await handleCreate("opportunities", { name: "O", keyResultId: kr.id, links: [
    { label: " Estudo de churn ", url: "https://docs.google.com/document/d/abc" },
    { url: "amplitude.com/chart/123" },
    { label: "xss", url: "javascript:alert(1)" },
    { label: "dup", url: "https://docs.google.com/document/d/abc" },
    { label: "ftp", url: "ftp://x.com/a" },
  ] }, ADMIN, config)).body;
  assert.deepEqual(o.links, [
    { label: "Estudo de churn", url: "https://docs.google.com/document/d/abc" },
    { label: "amplitude.com", url: "https://amplitude.com/chart/123" },
  ]);
});

test("objetivo guarda a meta em texto", async () => {
  const config = fakeConfig();
  const o = (await handleCreate("objectives", { name: "Engajamento", product: "STLFLIX", goal: " +20% de DAU até dezembro " }, ADMIN, config)).body;
  assert.equal(o.goal, "+20% de DAU até dezembro");
  assert.equal((await handleUpdate("objectives", o.id, { goal: "" }, ADMIN, config)).body.goal, "");
});

test("KR guarda o responsável", async () => {
  const config = fakeConfig();
  const { obj } = await tree(config);
  const kr = (await handleCreate("keyResults", { name: "Churn", objectiveId: obj.id, owner: " Caroline Araújo " }, ADMIN, config)).body;
  assert.equal(kr.owner, "Caroline Araújo");
});

test("KR tem produto, quarter, links e épicos (um épico num KR só)", async () => {
  const config = fakeConfig();
  const { obj } = await tree(config);
  const a = (await handleCreate("keyResults", { name: "Churn < 5%", objectiveId: obj.id, product: "STLFLIX", quarter: "Q4/2026", links: [{ url: "https://x.com/dash" }], epicKeys: ["FLIX-1", "FLIX-2"], status: "Planejado" }, ADMIN, config)).body;
  assert.equal(a.product, "STLFLIX");
  assert.equal(a.quarter, "Q4/2026");
  assert.equal(a.status, "Planejado");
  assert.equal(a.links[0].url, "https://x.com/dash");
  assert.equal((await handleUpdate("keyResults", a.id, { quarter: "Q9/2026" }, ADMIN, config)).body.quarter, "Q4/2026");
  await handleCreate("keyResults", { name: "Outro", objectiveId: obj.id, epicKeys: ["FLIX-2"] }, ADMIN, config);
  const list = (await handleList("keyResults", config)).body;
  assert.deepEqual(list.find((k) => k.id === a.id).epicKeys, ["FLIX-1"]);
});

test("solução fica entre oportunidade e experimento; não apaga com experimento dentro", async () => {
  const config = fakeConfig();
  const { opp } = await tree(config);
  assert.equal((await handleCreate("solutions", { name: "S" }, ADMIN, config)).status, 400);
  const sol = (await handleCreate("solutions", { name: "Onboarding guiado", opportunityId: opp.id }, ADMIN, config)).body;
  assert.equal(sol.status, "Ideia");
  const x = (await handleCreate("experiments", { name: "Teste A/B", opportunityId: opp.id, solutionId: sol.id }, ADMIN, config)).body;
  assert.equal(x.solutionId, sol.id);
  assert.equal((await handleDelete("opportunities", opp.id, ADMIN, config)).status, 409);
  assert.equal((await handleDelete("solutions", sol.id, ADMIN, config)).status, 409);
  await handleDelete("experiments", x.id, ADMIN, config);
  assert.equal((await handleDelete("solutions", sol.id, ADMIN, config)).status, 200);
});
