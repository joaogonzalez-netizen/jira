import { test } from "node:test";
import assert from "node:assert/strict";
import { createMemoryKv } from "./roadmap-core.js";
import { extractSheetId, handleGet, handleSet, loadConfig, readSheetIdOverride } from "./sheet-config-core.js";
import { handleSync } from "./sheet-core.js";

const SUPER = { role: "super", user: { id: "1", email: "joao@x.com" } };
const ADMIN = { role: "admin", user: { id: "2", email: "andre@x.com" } };
const LEITOR = { role: "user", user: { id: "3", email: "leitor@x.com" } };
const ENV = { GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: "svc@proj.iam.gserviceaccount.com", private_key: "x" }) };
const mk = () => loadConfig(ENV, createMemoryKv());

test("extractSheetId aceita ID puro, link completo e lixo/vazio", () => {
  const id = "1HteBrBkY4XCkmXGMTJIuA2EXAraZsDKw_xjZu0xoUgw";
  assert.equal(extractSheetId(id), id);
  assert.equal(extractSheetId(`  ${id}  `), id);
  assert.equal(extractSheetId(`https://docs.google.com/spreadsheets/d/${id}/edit#gid=0`), id);
  assert.equal(extractSheetId(`https://docs.google.com/spreadsheets/d/${id}`), id);
  assert.equal(extractSheetId(""), "");
  assert.equal(extractSheetId(null), "");
});

test("sem override salvo: o sync usa a planilha padrão (override null)", async () => {
  assert.equal(await readSheetIdOverride(mk()), null);
});

test("só admin/super leem e gravam; anônimo e leitor não", async () => {
  const c = mk();
  assert.equal((await handleGet(c, null)).status, 403);
  assert.match((await handleGet(c, null)).body.message, /ver a planilha/);
  assert.match((await handleSet({ sheetId: "abc" }, null, c)).body.message, /alterar a planilha/);
  assert.equal((await handleGet(c, LEITOR)).status, 403);
  assert.equal((await handleSet({ sheetId: "abc" }, null, c)).status, 403);
  assert.equal((await handleSet({ sheetId: "abc" }, LEITOR, c)).status, 403);
  const ok = await handleSet({ sheetId: "abc123" }, ADMIN, c);
  assert.equal(ok.status, 200);
  const got = await handleGet(c, SUPER);
  assert.equal(got.body.sheetId, "abc123");
  assert.equal(got.body.serviceAccountEmail, "svc@proj.iam.gserviceaccount.com");
});

test("salvar a partir de link extrai o ID; vazio é recusado", async () => {
  const c = mk();
  const r = await handleSet({ sheetId: "https://docs.google.com/spreadsheets/d/XYZ_789-abc/edit?usp=sharing" }, SUPER, c);
  assert.equal(r.body.sheetId, "XYZ_789-abc");
  assert.equal(await readSheetIdOverride(c), "XYZ_789-abc");
  assert.equal((await handleSet({ sheetId: "   " }, SUPER, c)).status, 400);
  assert.equal((await handleSet({}, SUPER, c)).status, 400);
});

test("falha ao ler o override NÃO cai na planilha padrão (propaga o erro)", async () => {
  const kv = createMemoryKv();
  kv.get = async () => { throw new Error("redis fora do ar"); };
  const c = loadConfig(ENV, kv);
  await assert.rejects(() => readSheetIdOverride(c), /redis fora do ar/);
  const corrupto = createMemoryKv();
  await corrupto.set("jira:sheet-config", "{não é json");
  await assert.rejects(() => readSheetIdOverride(loadConfig(ENV, corrupto)));
});

test("sem Redis configurado o recurso fica desligado e o sync segue na planilha padrão", async () => {
  const c = loadConfig({});
  assert.deepEqual(c.missing, ["REDIS_URL"]);
  assert.equal(await readSheetIdOverride(c), null);
});

test("handleSync usa o override quando existe, e o padrão quando não", async () => {
  const urls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    if (String(url).includes("oauth2.googleapis.com")) return { ok: true, json: async () => ({ access_token: "t" }) };
    if (String(url).includes("fields=sheets.properties.title")) return { ok: true, json: async () => ({ sheets: [{ properties: { title: "Aba" } }] }) };
    return { ok: true, json: async () => ({ values: [["Key"], ["A-1"]] }) };
  };
  try {
    const { generateKeyPairSync } = await import("node:crypto");
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const config = { missing: [], sheetId: "PADRAO", clientEmail: "svc@x", privateKey: privateKey.export({ type: "pkcs8", format: "pem" }) };
    const comOverride = await handleSync(config, "OUTRA");
    assert.equal(comOverride.status, 200);
    assert.ok(urls.some((u) => u.includes("/spreadsheets/OUTRA")), "usou a planilha configurada");
    assert.ok(!urls.some((u) => u.includes("/spreadsheets/PADRAO")), "não tocou na padrão");
    urls.length = 0;
    await handleSync(config, null);
    assert.ok(urls.some((u) => u.includes("/spreadsheets/PADRAO")), "sem override usa a padrão");
  } finally {
    globalThis.fetch = realFetch;
  }
});
