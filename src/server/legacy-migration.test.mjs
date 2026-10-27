import { test } from "node:test";
import assert from "node:assert/strict";
import { migrateInitiativesToFeatures } from "./legacy-migration.js";

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
