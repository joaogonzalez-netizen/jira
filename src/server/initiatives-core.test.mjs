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

test("iniciativa de OKR antiga (sem produto) continua sendo lida e editada", async () => {
  const config = fakeConfig();
  await config.kv.set("jira:initiatives", JSON.stringify([{ id: "init_old", name: "Antiga", product: "", epicKeys: ["IA-1"] }]));
  const list = (await handleList(config)).body;
  assert.equal(list[0].name, "Antiga");
  const u = await handleUpdate("init_old", { status: "Concluída" }, ADMIN, config);
  assert.equal(u.body.status, "Concluída");
  assert.deepEqual(u.body.epicKeys, ["IA-1"]);
});

test("ao listar, as iniciativas do Roadmap (com produto, sem KR) viram features", async () => {
  const config = fakeConfig();
  await config.kv.set("jira:initiatives", JSON.stringify([
    { id: "init_a", name: "Calculadora", product: "STL Seller", epicKeys: ["SELLER-42"] },
    { id: "init_b", name: "Reduzir cancelamento", product: "STLFLIX", keyResultId: "kr_1", epicKeys: [] },
  ]));
  const list = (await handleList(config)).body;
  assert.deepEqual(list.map((i) => i.id), ["init_b"]);
  const features = JSON.parse(await config.kv.get("jira:features"));
  assert.equal(features[0].name, "Calculadora");
  assert.deepEqual(features[0].epicKeys, ["SELLER-42"]);
});
