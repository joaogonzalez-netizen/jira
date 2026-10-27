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
      set: async (k, v) => { data.set(k, v); },
    },
    kvReady: null,
  };
}

async function tree(config) {
  const obj = (await handleCreate("objectives", { name: "Engajamento na Flix", period: "2026-T4" }, ADMIN, config)).body;
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
  const r = await handleCreate("objectives", { name: " Engajamento ", period: "2026-T4" }, ADMIN, config);
  assert.equal(r.status, 201);
  assert.equal(r.body.name, "Engajamento");
  assert.equal(r.body.period, "2026-T4");
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
  const next = applyFields("keyResults", base, { name: " ", objectiveId: "", epicKeys: ["X-1"] });
  assert.equal(next.name, "Nome");
  assert.equal(next.objectiveId, "obj_1");
  assert.equal("epicKeys" in next, false);
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
