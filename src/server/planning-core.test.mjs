import { test } from "node:test";
import assert from "node:assert/strict";
import { applyFields, handleCreate, handleDelete, handleList, handleUpdate } from "./planning-core.js";

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

test("kind desconhecido é recusado em todas as operações", async () => {
  const config = fakeConfig();
  assert.equal((await handleList("nope", config)).status, 400);
  assert.equal((await handleList("constructor", config)).status, 400);
  assert.equal((await handleList("__proto__", config)).status, 400);
  assert.equal((await handleList(undefined, config)).status, 400);
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

test("cria objetivo com padrões e exige nome", async () => {
  const config = fakeConfig();
  assert.equal((await handleCreate("objectives", { name: "  " }, ADMIN, config)).status, 400);
  const r = await handleCreate("objectives", { name: "  Crescer MRR " }, ADMIN, config);
  assert.equal(r.status, 201);
  assert.equal(r.body.name, "Crescer MRR");
  assert.equal(r.body.status, "Em andamento");
  assert.deepEqual(r.body.epicKeys, []);
  assert.equal(r.body.createdBy, "ana@x.com");
  assert.deepEqual((await handleList("objectives", config)).body.map((o) => o.id), [r.body.id]);
});

test("objetivos e releases ficam em listas separadas", async () => {
  const config = fakeConfig();
  await handleCreate("objectives", { name: "Obj" }, ADMIN, config);
  await handleCreate("releases", { name: "v1" }, ADMIN, config);
  assert.equal((await handleList("objectives", config)).body.length, 1);
  assert.equal((await handleList("releases", config)).body.length, 1);
});

test("release valida data e status e guarda épicos sem duplicar", async () => {
  const config = fakeConfig();
  const r = await handleCreate("releases", { name: "v1", date: "2026-11-30", epicKeys: ["FLIX-1", "FLIX-1", "IA-2", 7] }, ADMIN, config);
  assert.equal(r.body.date, "2026-11-30");
  assert.deepEqual(r.body.epicKeys, ["FLIX-1", "IA-2"]);

  const u = await handleUpdate("releases", r.body.id, { date: "30/11/2026", status: "Inventado" }, ADMIN, config);
  assert.equal(u.body.date, "2026-11-30");
  assert.equal(u.body.status, "Planejada");

  const lancada = await handleUpdate("releases", r.body.id, { status: "Lançada", date: "" }, ADMIN, config);
  assert.equal(lancada.body.status, "Lançada");
  assert.equal(lancada.body.date, "");
});

test("update não troca o nome por vazio e ignora campos de outro tipo", () => {
  const base = { id: "a", name: "Nome", status: "Em andamento", epicKeys: [] };
  const next = applyFields("objectives", base, { name: " ", product: "STL Seller", date: "2026-01-01" });
  assert.equal(next.name, "Nome");
  assert.equal("product" in next, false);
  assert.equal("date" in next, false);
});

test("update e delete devolvem 404 para id inexistente e removem o certo", async () => {
  const config = fakeConfig();
  const a = (await handleCreate("objectives", { name: "A" }, ADMIN, config)).body;
  const b = (await handleCreate("objectives", { name: "B" }, ADMIN, config)).body;
  assert.equal((await handleUpdate("objectives", "x", { name: "Z" }, ADMIN, config)).status, 404);
  assert.equal((await handleDelete("objectives", "x", ADMIN, config)).status, 404);
  assert.equal((await handleDelete("objectives", a.id, ADMIN, config)).status, 200);
  assert.deepEqual((await handleList("objectives", config)).body.map((o) => o.id), [b.id]);
});

test("feature exige produto, guarda épicos e não troca o produto por vazio", async () => {
  const config = fakeConfig();
  assert.equal((await handleCreate("features", { name: "Calculadora" }, ADMIN, config)).status, 400);
  const r = await handleCreate("features", { name: "Calculadora", product: " STL Seller ", epicKeys: ["SELLER-256"] }, ADMIN, config);
  assert.equal(r.status, 201);
  assert.equal(r.body.product, "STL Seller");
  assert.equal(r.body.status, "Ativa");
  assert.deepEqual(r.body.epicKeys, ["SELLER-256"]);
  const u = await handleUpdate("features", r.body.id, { product: "  ", status: "Descontinuada" }, ADMIN, config);
  assert.equal(u.body.product, "STL Seller");
  assert.equal(u.body.status, "Descontinuada");
});
