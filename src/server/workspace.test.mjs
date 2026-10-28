import { test } from "node:test";
import assert from "node:assert/strict";
import { scopeConfig, scopeKv, resolveWorkspaceId } from "./workspace.js";
import { handleCreate, handleList, handleUpdate, slugify } from "./workspaces-core.js";
import { handleGet as roadmapGet } from "./roadmap-core.js";
import { handleCreate as planCreate, handleList as planList } from "./planning-core.js";

const SUPER = { role: "super", user: { id: "1", email: "joao@x.com" } };
const ADMIN = { role: "admin", user: { id: "2", email: "ana@x.com" } };

function fakeKv() {
  const data = new Map();
  let connects = 0;
  return {
    data,
    get connects() { return connects; },
    connect: async () => { connects += 1; },
    get: async (k) => data.get(k) ?? null,
    set: async (k, v, opts) => {
      if (opts && opts.NX && data.has(k)) return null;
      data.set(k, String(v));
      return "OK";
    },
    del: async (k) => (data.delete(k) ? 1 : 0),
    eval: async (script, { keys, arguments: args }) => {
      const cur = data.has(keys[0]) ? data.get(keys[0]) : "";
      if (cur !== args[0]) return 0;
      data.set(keys[0], args[1]);
      return 1;
    },
  };
}
const config = (kv) => ({ missing: [], kv, kvReady: null, authConfig: { missing: ["x"] } });
const cookie = (id) => `auth_token=abc; pp-ws=${id}`;

test("padrão usa as chaves de sempre; outro workspace usa o prefixo", async () => {
  const kv = fakeKv();
  await scopeKv(kv, "").set("jira:objectives", "a");
  await scopeKv(kv, "growth-1").set("jira:objectives", "b");
  assert.equal(kv.data.get("jira:objectives"), "a");
  assert.equal(kv.data.get("ws:growth-1:jira:objectives"), "b");
});

test("cookie com id desconhecido, inválido ou ausente cai no padrão", async () => {
  const kv = fakeKv();
  kv.data.set("jira:workspaces", JSON.stringify([{ id: "growth-1", name: "Growth" }]));
  assert.equal(await resolveWorkspaceId(kv, cookie("growth-1")), "growth-1");
  assert.equal(await resolveWorkspaceId(kv, cookie("nao-existe")), "default");
  assert.equal(await resolveWorkspaceId(kv, cookie("../../etc")), "default");
  assert.equal(await resolveWorkspaceId(kv, "auth_token=abc"), "default");
  assert.equal(await resolveWorkspaceId(kv, undefined), "default");
});

test("o cliente conecta uma vez só, com ou sem escopo", async () => {
  const kv = fakeKv();
  const base = config(kv);
  await planList("objectives", base);
  await planList("objectives", await scopeConfig(base, cookie("default")));
  assert.equal(kv.connects, 1);
});

test("dados de um workspace não aparecem no outro", async () => {
  const kv = fakeKv();
  const base = config(kv);
  const ws = (await handleCreate({ name: "Growth Lab" }, SUPER, base)).body;
  const inWs = await scopeConfig(base, cookie(ws.id));
  await planCreate("objectives", { name: "Só no Growth", product: "STLFLIX" }, SUPER, inWs);
  await planCreate("objectives", { name: "Só no STLFLIX", product: "STLFLIX" }, SUPER, await scopeConfig(base, ""));
  assert.deepEqual((await planList("objectives", inWs)).body.map((o) => o.name), ["Só no Growth"]);
  assert.deepEqual((await planList("objectives", base)).body.map((o) => o.name), ["Só no STLFLIX"]);
});

test("criar projeto: só super, nome obrigatório, Roadmap já nasce no servidor", async () => {
  const kv = fakeKv();
  const base = config(kv);
  assert.equal((await handleCreate({ name: "X" }, ADMIN, base)).status, 403);
  assert.equal((await handleCreate({ name: " " }, SUPER, base)).status, 400);
  const r = await handleCreate({ name: "Automações Lab", color: "#nao-da-paleta" }, SUPER, base);
  assert.equal(r.status, 201);
  assert.match(r.body.id, /^automacoes-lab-[a-z0-9]{6}$/);
  assert.equal(r.body.initials, "AL");
  assert.notEqual(r.body.color, "#nao-da-paleta");
  const roadmap = await roadmapGet(await scopeConfig(base, cookie(r.body.id)));
  assert.equal(roadmap.status, 200);
});

test("lista: padrão primeiro, identidade do padrão editável sem mover dados", async () => {
  const kv = fakeKv();
  const base = config(kv);
  assert.equal((await handleList(null, base)).status, 401);
  await handleCreate({ name: "Growth" }, SUPER, base);
  let list = (await handleList(ADMIN, base)).body;
  assert.deepEqual(list.map((w) => w.id === "default" ? "default" : "outro"), ["default", "outro"]);
  assert.equal(list[0].name, "STLFLIX");
  assert.equal((await handleUpdate("default", { name: "STLFLIX Produto", initials: "SP", color: "#5166e6" }, ADMIN, base)).status, 403);
  await handleUpdate("default", { name: "STLFLIX Produto", initials: "SP", color: "#5166e6" }, SUPER, base);
  list = (await handleList(ADMIN, base)).body;
  assert.equal(list[0].name, "STLFLIX Produto");
  assert.equal(list[0].initials, "SP");
  assert.equal(list.length, 2);
  assert.equal((await handleUpdate("nao-existe", { name: "Z" }, SUPER, base)).status, 404);
});

test("slugify tira acento e símbolo", () => {
  assert.equal(slugify("Automações & Custom!"), "automacoes-custom");
  assert.equal(slugify("***"), "projeto");
});
