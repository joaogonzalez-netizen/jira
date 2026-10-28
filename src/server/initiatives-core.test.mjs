import { test } from "node:test";
import assert from "node:assert/strict";
import { handleCreate, handleList, handleUpdate } from "./initiatives-core.js";

const ADMIN = { role: "admin", user: { id: "1", email: "ana@x.com" } };

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

test("iniciativa nasce sem produto, com status e KR", async () => {
  const config = fakeConfig();
  assert.equal((await handleCreate({ name: " " }, ADMIN, config)).status, 400);
  const r = await handleCreate({ name: "Reduzir cancelamento", keyResultId: "kr_1", description: "Churn mensal" }, ADMIN, config);
  assert.equal(r.status, 201);
  assert.equal(r.body.product, "");
  assert.equal(r.body.status, "Planejada");
  assert.equal(r.body.keyResultId, "kr_1");
  assert.equal(r.body.description, "Churn mensal");
  assert.deepEqual(r.body.epicKeys, []);
});

test("o Roadmap continua criando iniciativa com produto", async () => {
  const config = fakeConfig();
  const r = await handleCreate({ name: "Calculadora 2.0", product: "STL Seller" }, ADMIN, config);
  assert.equal(r.body.product, "STL Seller");
});

test("update troca status válido, ignora inválido e aceita KR e produto vazios", async () => {
  const config = fakeConfig();
  const ini = (await handleCreate({ name: "I", product: "STLFLIX", keyResultId: "kr_1" }, ADMIN, config)).body;
  const u = await handleUpdate(ini.id, { status: "Em andamento", keyResultId: "", product: "" }, ADMIN, config);
  assert.equal(u.body.status, "Em andamento");
  assert.equal(u.body.keyResultId, "");
  assert.equal(u.body.product, "");
  assert.equal((await handleUpdate(ini.id, { status: "Sei lá" }, ADMIN, config)).body.status, "Em andamento");
});

test("iniciativa: data de entrega, quarter Q1–Q4/ano e links", async () => {
  const config = fakeConfig();
  const r = await handleCreate({ name: "Reduzir cancelamento", dueDate: "2026-12-15", quarter: "Q4/2026", links: [{ label: "Dash", url: "https://app.amplitude.com/x" }, { url: "javascript:void(0)" }] }, ADMIN, config);
  assert.equal(r.body.dueDate, "2026-12-15");
  assert.equal(r.body.quarter, "Q4/2026");
  assert.deepEqual(r.body.links, [{ label: "Dash", url: "https://app.amplitude.com/x" }]);
  const u = await handleUpdate(r.body.id, { quarter: "Q5/2026", dueDate: "15/12/2026" }, ADMIN, config);
  assert.equal(u.body.quarter, "Q4/2026");
  assert.equal(u.body.dueDate, "2026-12-15");
  assert.equal((await handleUpdate(r.body.id, { quarter: "", links: [] }, ADMIN, config)).body.quarter, "");
});


test("ao listar: as do Roadmap viram features e as de OKR viram Key Results", async () => {
  const config = fakeConfig();
  await config.kv.set("jira:initiatives", JSON.stringify([
    { id: "init_a", name: "Calculadora", product: "STL Seller", epicKeys: ["SELLER-42"] },
    { id: "init_b", name: "Reduzir cancelamento", product: "STLFLIX", objectiveId: "obj_1", status: "Pausada", quarter: "Q4/2026", epicKeys: ["FLIX-1"] },
  ]));
  assert.deepEqual((await handleList(config)).body, []);
  const features = JSON.parse(await config.kv.get("jira:features"));
  assert.deepEqual(features.map((f) => f.id), ["init_a"]);
  const krs = JSON.parse(await config.kv.get("jira:key-results"));
  assert.deepEqual(krs.map((k) => [k.id, k.objectiveId, k.status, k.quarter, k.epicKeys.join()]), [["init_b", "obj_1", "Pausado", "Q4/2026", "FLIX-1"]]);
});
