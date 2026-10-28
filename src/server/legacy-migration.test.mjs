import { test } from "node:test";
import assert from "node:assert/strict";
import { migrateInitiativesToFeatures, migrateInitiativesToKeyResults, runMigrations } from "./legacy-migration.js";

function fakeKv(seed = {}) {
  const data = new Map(Object.entries(seed).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    data,
    get: async (k) => data.get(k) ?? null,
    set: async (k, v, opts) => {
      if (opts && opts.NX && data.has(k)) return null;
      data.set(k, v);
      return "OK";
    },
    del: async (k) => (data.delete(k) ? 1 : 0),
  };
}
const read = (kv, k) => JSON.parse(kv.data.get(k) || "[]");

const ROADMAP = [
  { id: "init_1", name: "Calculadora", product: "STL Seller", epicKeys: ["SELLER-42", "SELLER-155"], createdBy: "joao@x.com", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "init_2", name: "Explore", product: "STLFLIX", epicKeys: ["FLIX-168"] },
  { id: "init_3", name: "Reduzir cancelamento", product: "", status: "Em andamento", epicKeys: ["FLIX-3"] },
  { id: "init_4", name: "Retenção", product: "STLFLIX", keyResultId: "kr_1", epicKeys: [] },
];

test("iniciativas do Roadmap viram features, com backup; as de OKR ficam", async () => {
  const kv = fakeKv({ "jira:initiatives": ROADMAP });
  await migrateInitiativesToFeatures(kv);

  const features = read(kv, "jira:features");
  assert.deepEqual(features.map((f) => [f.id, f.name, f.product, f.status]), [
    ["init_1", "Calculadora", "STL Seller", "Ativa"],
    ["init_2", "Explore", "STLFLIX", "Ativa"],
  ]);
  assert.deepEqual(features[0].epicKeys, ["SELLER-42", "SELLER-155"]);
  assert.equal(features[0].createdBy, "joao@x.com");
  assert.deepEqual(read(kv, "jira:initiatives").map((i) => i.id), ["init_3", "init_4"]);
  assert.deepEqual(read(kv, "jira:backup:initiatives-before-features"), ROADMAP);
  assert.equal(kv.data.get("jira:migrations:initiatives-to-features"), "done");
});

test("roda uma vez só: depois de feita, não mexe em mais nada", async () => {
  const kv = fakeKv({ "jira:initiatives": ROADMAP });
  await migrateInitiativesToFeatures(kv);
  await kv.set("jira:initiatives", JSON.stringify([{ id: "init_new", name: "Nova", product: "STL IA", epicKeys: [] }]));
  await migrateInitiativesToFeatures(kv);
  assert.equal(read(kv, "jira:features").length, 2);
  assert.equal(read(kv, "jira:initiatives")[0].id, "init_new");
});

test("chamadas simultâneas não duplicam", async () => {
  const kv = fakeKv({ "jira:initiatives": ROADMAP });
  await Promise.all([migrateInitiativesToFeatures(kv), migrateInitiativesToFeatures(kv), migrateInitiativesToFeatures(kv)]);
  assert.equal(read(kv, "jira:features").length, 2);
});

test("épico que já está numa feature não é duplicado em outra", async () => {
  const kv = fakeKv({
    "jira:initiatives": ROADMAP,
    "jira:features": [{ id: "feat_x", name: "Calc antiga", product: "STL Seller", status: "Ativa", epicKeys: ["SELLER-42"] }],
  });
  await migrateInitiativesToFeatures(kv);
  const calc = read(kv, "jira:features").find((f) => f.id === "init_1");
  assert.deepEqual(calc.epicKeys, ["SELLER-155"]);
});

test("retomada depois de falha no meio não duplica a feature", async () => {
  const kv = fakeKv({
    "jira:initiatives": ROADMAP,
    "jira:features": [{ id: "init_1", name: "Calculadora", product: "STL Seller", status: "Ativa", epicKeys: ["SELLER-42", "SELLER-155"] }],
  });
  await migrateInitiativesToFeatures(kv);
  assert.deepEqual(read(kv, "jira:features").map((f) => f.id), ["init_1", "init_2"]);
});

test("sem nada para migrar, só marca como feita", async () => {
  const kv = fakeKv();
  await migrateInitiativesToFeatures(kv);
  assert.equal(kv.data.has("jira:features"), false);
  assert.equal(kv.data.get("jira:migrations:initiatives-to-features"), "done");
});

test("iniciativas de OKR viram Key Results; a que movia um KR soma nele", async () => {
  const kv = fakeKv({
    "jira:initiatives": [
      { id: "ini_1", name: "Reduzir cancelamento", product: "STLFLIX", objectiveId: "obj_1", status: "Em andamento", quarter: "Q4/2026", dueDate: "2026-12-01", links: [{ label: "Dash", url: "https://a.com/" }], epicKeys: ["FLIX-1", "FLIX-2"] },
      { id: "ini_2", name: "Onboarding", product: "", keyResultId: "kr_1", status: "Concluída", quarter: "Q3/2026", links: [{ label: "Estudo", url: "https://b.com/" }], epicKeys: ["FLIX-3", "FLIX-9"] },
      { id: "ini_3", name: "Sem objetivo", product: "", epicKeys: [] },
    ],
    "jira:key-results": [{ id: "kr_1", name: "DAU/MAU", objectiveId: "obj_1", status: "Em andamento", epicKeys: ["FLIX-9"], links: [] }],
  });
  await migrateInitiativesToKeyResults(kv);
  const krs = read(kv, "jira:key-results");
  const kr1 = krs.find((k) => k.id === "kr_1");
  assert.deepEqual(kr1.epicKeys, ["FLIX-9", "FLIX-3"]);
  assert.equal(kr1.quarter, "Q3/2026");
  assert.deepEqual(kr1.links.map((l) => l.url), ["https://b.com/"]);
  const ini1 = krs.find((k) => k.id === "ini_1");
  assert.deepEqual([ini1.name, ini1.objectiveId, ini1.product, ini1.status, ini1.quarter, ini1.dueDate], ["Reduzir cancelamento", "obj_1", "STLFLIX", "Em andamento", "Q4/2026", "2026-12-01"]);
  assert.deepEqual(ini1.epicKeys, ["FLIX-1", "FLIX-2"]);
  assert.equal(krs.find((k) => k.id === "ini_3").objectiveId, "");
  assert.deepEqual(read(kv, "jira:initiatives"), []);
  assert.equal(read(kv, "jira:backup:initiatives-before-krs").length, 3);
});

test("migração para KR é idempotente e não duplica com chamadas simultâneas", async () => {
  const kv = fakeKv({ "jira:initiatives": [{ id: "ini_1", name: "X", objectiveId: "obj_1", epicKeys: ["A-1"] }] });
  await Promise.all([runMigrations(kv), runMigrations(kv), runMigrations(kv)]);
  await runMigrations(kv);
  assert.equal(read(kv, "jira:key-results").length, 1);
});

test("roda as duas na ordem: do Roadmap para features, o resto para KR", async () => {
  const kv = fakeKv({ "jira:initiatives": [
    { id: "r1", name: "Calculadora", product: "STL Seller", epicKeys: ["SELLER-1"] },
    { id: "o1", name: "Retenção", product: "STLFLIX", objectiveId: "obj_1", epicKeys: [] },
  ] });
  await runMigrations(kv);
  assert.deepEqual(read(kv, "jira:features").map((f) => f.id), ["r1"]);
  assert.deepEqual(read(kv, "jira:key-results").map((k) => k.id), ["o1"]);
  assert.deepEqual(read(kv, "jira:initiatives"), []);
});
