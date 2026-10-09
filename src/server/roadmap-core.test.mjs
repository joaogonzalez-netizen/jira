import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyDiff,
  createMemoryKv,
  handleGet,
  handlePatch,
  handleSeed,
  handleSnapshotGet,
  handleSnapshotPut,
  loadConfig,
} from "./roadmap-core.js";

const SUPER = { role: "super", user: { id: "1", email: "joao@x.com" } };
const ANDRE = { role: "admin", user: { id: "2", email: "andre@x.com" } };
const MARIA = { role: "admin", user: { id: "3", email: "maria@x.com" } };
const LEITOR = { role: "user", user: { id: "4", email: "leitor@x.com" } };

const epic = (key, createdBy, summary = "Novo") => ({ key, summary, createdBy, status: "Rascunho", epic: true });
const pos = (lane, startWeek, durationWeeks = 2) => ({ roadmapLane: lane, startWeek, durationWeeks });

const SEED = {
  state: {
    positions: { "SELLER-1": pos("STL Seller", 0), "NOVO-100": pos("STL IA", 1), "NOVO-200": pos(null, null) },
    customEpics: [epic("NOVO-100", "joao@x.com"), epic("NOVO-200", "andre@x.com")],
    prioOrder: ["SELLER-1", "NOVO-100"],
    filaProdutoOrder: ["FLIX-1", "NOVO-200"],
    filaUxOrder: [],
  },
};

async function fresh() {
  const kv = createMemoryKv();
  const config = loadConfig({}, kv);
  const seeded = await handleSeed(SEED, SUPER, config);
  assert.equal(seeded.status, 201);
  return { kv, config };
}

test("seed: só super, e só uma vez", async () => {
  const kv = createMemoryKv();
  const config = loadConfig({}, kv);
  assert.equal((await handleSeed(SEED, ANDRE, config)).status, 403);
  assert.equal((await handleSeed(SEED, null, config)).status, 403);
  assert.equal((await handleSeed(SEED, SUPER, config)).status, 201);
  const again = await handleSeed({ state: { positions: {} } }, SUPER, config);
  assert.equal(again.status, 409);
  const got = await handleGet(config);
  assert.equal(got.body.state.positions["SELLER-1"].roadmapLane, "STL Seller");
  assert.equal(got.body.state.customEpics.length, 2);
});

test("get sem estado devolve state null (cliente decide migrar)", async () => {
  const config = loadConfig({}, createMemoryKv());
  const r = await handleGet(config);
  assert.equal(r.status, 200);
  assert.equal(r.body.state, null);
});

test("patch antes da migração é recusado (não inicializa por acidente)", async () => {
  const config = loadConfig({}, createMemoryKv());
  const r = await handlePatch({ positions: { "NOVO-1": pos("STLFLIX", 0) } }, SUPER, config);
  assert.equal(r.status, 409);
  assert.equal(r.body.code, "not-initialized");
});

test("leitor e anônimo não escrevem", async () => {
  const { config } = await fresh();
  assert.equal((await handlePatch({ positions: { "NOVO-100": pos("STL IA", 3) } }, LEITOR, config)).status, 403);
  assert.equal((await handlePatch({ positions: { "NOVO-100": pos("STL IA", 3) } }, null, config)).status, 403);
});

test("super muda posição de épico da planilha; admin não", async () => {
  const { config } = await fresh();
  const ok = await handlePatch({ positions: { "SELLER-1": pos("STL Seller", 5) } }, SUPER, config);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.state.positions["SELLER-1"].startWeek, 5);
  const no = await handlePatch({ positions: { "SELLER-1": pos("STL Seller", 9) } }, ANDRE, config);
  assert.equal(no.status, 403);
  assert.equal((await handleGet(config)).body.state.positions["SELLER-1"].startWeek, 5);
});

test("admin cria o próprio épico (createdBy forçado) e posiciona", async () => {
  const { config } = await fresh();
  const r = await handlePatch(
    { customEpics: { upsert: [epic("NOVO-300", "outra-pessoa@x.com", "Meu card")] }, positions: { "NOVO-300": pos("STLFLIX", 2) } },
    ANDRE,
    config,
  );
  assert.equal(r.status, 200);
  const created = r.body.state.customEpics.find((e) => e.key === "NOVO-300");
  assert.equal(created.createdBy, "andre@x.com");
  assert.equal(r.body.state.positions["NOVO-300"].startWeek, 2);
});

test("admin edita e exclui o próprio, mas não o de outra pessoa", async () => {
  const { config } = await fresh();
  const edit = await handlePatch({ customEpics: { upsert: [epic("NOVO-200", "x", "Renomeado")] }, positions: { "NOVO-200": pos("STLFLIX", 1) } }, ANDRE, config);
  assert.equal(edit.status, 200);
  assert.equal(edit.body.state.customEpics.find((e) => e.key === "NOVO-200").summary, "Renomeado");
  assert.equal(edit.body.state.customEpics.find((e) => e.key === "NOVO-200").createdBy, "andre@x.com");

  const stealEdit = await handlePatch({ customEpics: { upsert: [epic("NOVO-100", "andre@x.com", "Sequestrado")] } }, ANDRE, config);
  assert.equal(stealEdit.status, 403);
  const stealDelete = await handlePatch({ customEpics: { remove: ["NOVO-100"] }, positions: { "NOVO-100": null } }, ANDRE, config);
  assert.equal(stealDelete.status, 403);
  const stealPos = await handlePatch({ positions: { "NOVO-100": pos("STLFLIX", 0) } }, ANDRE, config);
  assert.equal(stealPos.status, 403);

  const del = await handlePatch({ customEpics: { remove: ["NOVO-200"] }, positions: { "NOVO-200": null } }, ANDRE, config);
  assert.equal(del.status, 200);
  assert.equal(del.body.state.customEpics.some((e) => e.key === "NOVO-200"), false);
  assert.equal("NOVO-200" in del.body.state.positions, false);
});

test("admin entra/sai das filas só com card próprio e sem reordenar", async () => {
  const { config } = await fresh();
  // move NOVO-200 (dele) da fila de Produto pra UX, como o botão da tela faz
  const move = await handlePatch({ filaProdutoOrder: ["FLIX-1"], filaUxOrder: ["NOVO-200"] }, ANDRE, config);
  assert.equal(move.status, 200);
  assert.deepEqual(move.body.state.filaUxOrder, ["NOVO-200"]);
  // tirar card alheio da fila: não
  const steal = await handlePatch({ filaProdutoOrder: [] }, ANDRE, config);
  assert.equal(steal.status, 403);
  // reordenar: não
  await handlePatch({ prioOrder: ["SELLER-1", "NOVO-100"] }, SUPER, config);
  const reorder = await handlePatch({ prioOrder: ["NOVO-100", "SELLER-1"] }, ANDRE, config);
  assert.equal(reorder.status, 403);
  // super reordena
  const sup = await handlePatch({ prioOrder: ["NOVO-100", "SELLER-1"] }, SUPER, config);
  assert.equal(sup.status, 200);
  assert.deepEqual(sup.body.state.prioOrder, ["NOVO-100", "SELLER-1"]);
});

test("filas por operação: admin entra/sai com card próprio mesmo com a fila já reordenada pelo super", async () => {
  const { config } = await fresh();
  // super reordena a fila de Produto depois que o admin carregou a tela
  await handlePatch({ filaProdutoOrder: { set: ["NOVO-200", "FLIX-1"] } }, SUPER, config);
  // o admin (tela antiga) só quer mandar o card dele pra UX: add/remove não depende da ordem atual
  const move = await handlePatch({ filaProdutoOrder: { remove: ["NOVO-200"] }, filaUxOrder: { add: ["NOVO-200"] } }, ANDRE, config);
  assert.equal(move.status, 200);
  assert.deepEqual(move.body.state.filaProdutoOrder, ["FLIX-1"]);
  assert.deepEqual(move.body.state.filaUxOrder, ["NOVO-200"]);
  // add idempotente, sem duplicar
  const again = await handlePatch({ filaUxOrder: { add: ["NOVO-200"] } }, ANDRE, config);
  assert.deepEqual(again.body.state.filaUxOrder, ["NOVO-200"]);
  // não mexe na fila com card de outra pessoa, nem adicionando nem tirando
  assert.equal((await handlePatch({ filaUxOrder: { add: ["NOVO-100"] } }, ANDRE, config)).status, 403);
  assert.equal((await handlePatch({ filaProdutoOrder: { remove: ["FLIX-1"] } }, ANDRE, config)).status, 403);
  // super faz qualquer operação
  const sup = await handlePatch({ filaProdutoOrder: { add: ["SELLER-1"], remove: ["FLIX-1"] } }, SUPER, config);
  assert.deepEqual(sup.body.state.filaProdutoOrder, ["SELLER-1"]);
  // validação do formato novo
  assert.equal((await handlePatch({ filaUxOrder: { add: "x" } }, SUPER, config)).status, 400);
  assert.equal((await handlePatch({ filaUxOrder: 7 }, SUPER, config)).status, 400);
});

test("positionsIfAbsent: não sobrescreve escolha manual e é só do super", async () => {
  const { config } = await fresh();
  const r = await handlePatch({ positionsIfAbsent: { "SELLER-1": pos("Backoffice", 9), "SELLER-2": pos("STL Seller", 0) } }, SUPER, config);
  assert.equal(r.status, 200);
  assert.equal(r.body.state.positions["SELLER-1"].roadmapLane, "STL Seller");
  assert.equal(r.body.state.positions["SELLER-2"].roadmapLane, "STL Seller");
  assert.equal((await handlePatch({ positionsIfAbsent: { "SELLER-3": pos("STL Seller", 0) } }, ANDRE, config)).status, 403);
});

test("diff sem mudança não incrementa a revisão", async () => {
  const { config } = await fresh();
  const before = (await handleGet(config)).body.rev;
  const r = await handlePatch({ positions: { "SELLER-1": pos("STL Seller", 0) } }, SUPER, config);
  assert.equal(r.status, 200);
  assert.equal(r.body.rev, before);
});

test("validação rejeita lixo", async () => {
  const { config } = await fresh();
  const bad = [
    { positions: { "../etc": pos("STLFLIX", 0) } },
    { positions: { "NOVO-100": { roadmapLane: "STL IA", startWeek: "3", durationWeeks: 2 } } },
    { positions: { "NOVO-100": { roadmapLane: "STL IA", startWeek: 1, durationWeeks: 0 } } },
    { positions: { "NOVO-100": { roadmapLane: "STL IA", startWeek: 1.5, durationWeeks: 2 } } },
    { customEpics: { upsert: [{ key: "SELLER-9", summary: "x" }] } },
    { customEpics: { upsert: [{ key: "NOVO-9", summary: 42 }] } },
    { prioOrder: "SELLER-1" },
    { prioOrder: [{ k: 1 }] },
    "string",
    [],
  ];
  for (const diff of bad) {
    const r = await handlePatch(diff, SUPER, config);
    assert.equal(r.status, 400, JSON.stringify(diff));
  }
});

test("concorrência: escrita no meio do read-modify-write não se perde", async () => {
  const { kv, config } = await fresh();
  let injected = false;
  const realEval = kv.eval.bind(kv);
  kv.eval = async (script, args) => {
    if (!injected) {
      injected = true;
      // outra pessoa grava depois que a primeira leu e antes dela gravar
      const other = await handlePatch({ customEpics: { upsert: [epic("NOVO-400", "maria@x.com", "Da Maria")] }, positions: { "NOVO-400": pos("STL Loja", 4) } }, MARIA, config);
      assert.equal(other.status, 200);
    }
    return realEval(script, args);
  };
  const mine = await handlePatch({ customEpics: { upsert: [epic("NOVO-500", "andre@x.com", "Do André")] }, positions: { "NOVO-500": pos("STLFLIX", 2) } }, ANDRE, config);
  assert.equal(mine.status, 200);
  const state = (await handleGet(config)).body.state;
  assert.ok(state.customEpics.some((e) => e.key === "NOVO-400"), "card da Maria preservado");
  assert.ok(state.customEpics.some((e) => e.key === "NOVO-500"), "card do André gravado");
  assert.ok(state.positions["NOVO-400"] && state.positions["NOVO-500"]);
});

test("snapshot da planilha: só super grava, todos leem, e o GET avisa o snapshotAt", async () => {
  const { config } = await fresh();
  const snap = { epics: [{ key: "A-1" }], tasks: [{ key: "A-2" }], syncedAt: "2026-10-09T10:00:00.000Z" };
  assert.equal((await handleSnapshotPut(snap, ANDRE, config)).status, 403);
  assert.equal((await handleSnapshotPut({ epics: [], tasks: "x" }, SUPER, config)).status, 400);
  assert.equal((await handleSnapshotPut(snap, SUPER, config)).status, 200);
  const got = await handleSnapshotGet(config);
  assert.equal(got.body.snapshot.tasks[0].key, "A-2");
  assert.equal((await handleGet(config)).body.snapshotAt, "2026-10-09T10:00:00.000Z");
});

test("seed aceita snapshot junto", async () => {
  const config = loadConfig({}, createMemoryKv());
  const snap = { epics: [{ key: "A-1" }], tasks: [], syncedAt: "2026-10-01T00:00:00.000Z" };
  const r = await handleSeed({ ...SEED, snapshot: snap }, SUPER, config);
  assert.equal(r.status, 201);
  assert.equal(r.body.snapshotAt, "2026-10-01T00:00:00.000Z");
});

test("applyDiff é pura: não muta o documento de entrada", () => {
  const doc = { v: 1, rev: 1, updatedAt: null, updatedBy: null, positions: { "SELLER-1": pos("STL Seller", 0) }, customEpics: [], prioOrder: [], filaProdutoOrder: [], filaUxOrder: [] };
  const snapshot = JSON.stringify(doc);
  const r = applyDiff(doc, { positions: { "SELLER-1": pos("STL Seller", 3) } }, SUPER);
  assert.equal(r.doc.positions["SELLER-1"].startWeek, 3);
  assert.equal(JSON.stringify(doc), snapshot);
});
