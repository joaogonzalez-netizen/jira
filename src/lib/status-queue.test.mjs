import { test } from "node:test";
import assert from "node:assert/strict";
import { QUEUE_STATUS_MAP, planQueueAutomation, queueTargetOf } from "./status-queue.js";

const card = (key, status, extra = {}) => ({ key, status, project: "STL Seller", ...extra });
const plan = (cards, { positions = {}, produto = [], ux = [] } = {}) =>
  planQueueAutomation({ cards, positions, filaProdutoOrder: produto, filaUxOrder: ux });

test("o mapa manda cada status para um destino só, com a grafia tolerante", () => {
  assert.equal(queueTargetOf(card("A", "Refinamento de negócio")), "produto");
  assert.equal(queueTargetOf(card("A", "em ANÁLISE")), "produto");
  assert.equal(queueTargetOf(card("A", "Fila da sprint UX")), "ux");
  assert.equal(queueTargetOf(card("A", "Pronto para testes")), "dev");
  assert.equal(queueTargetOf(card("A", "Backlog")), null);
  assert.equal(queueTargetOf(card("A", "Pronto P/ DEV")), null);
  const all = Object.values(QUEUE_STATUS_MAP).flat();
  assert.equal(new Set(all.map((s) => s.toLowerCase())).size, all.length, "status repetido em dois destinos");
});

test("card sem marca e fora das filas entra na fila do status e ganha a marca", () => {
  const out = plan([card("A", "Em análise"), card("B", "Em design")]);
  assert.deepEqual(out.filaProdutoOrder, ["A"]);
  assert.deepEqual(out.filaUxOrder, ["B"]);
  assert.equal(out.positions.A.autoQueue, "produto");
  assert.equal(out.positions.B.autoQueue, "ux");
  assert.equal(out.positions.A.roadmapLane, null);
});

test("nada a fazer devolve null: status sem regra, dev já fora das filas, concluído, sem produto, Gantt", () => {
  assert.equal(plan([card("A", "Backlog"), card("B", "Em DEV"), card("C", "Done"), card("D", "Em análise", { project: null }), card("E", "Em análise", { stage: "Concluído" })]), null);
  assert.equal(plan([card("A", "Em análise")], { positions: { A: { roadmapLane: "STL Seller", startWeek: 0, durationWeeks: 2 } } }), null);
});

test("já posto à mão numa fila (sem marca) não é mexido, mesmo com status de outra fila", () => {
  assert.equal(plan([card("A", "Em design")], { produto: ["A"] }), null);
  assert.equal(plan([card("A", "Em análise")], { ux: ["A"] }), null);
});

test("o status mudou e o card segue onde a automação o pôs: acompanha o status", () => {
  const positions = { A: { roadmapLane: null, startWeek: null, durationWeeks: 2, autoQueue: "produto" } };
  const out = plan([card("A", "Em design")], { positions, produto: ["X", "A"] });
  assert.deepEqual(out.filaProdutoOrder, ["X"]);
  assert.deepEqual(out.filaUxOrder, ["A"]);
  assert.equal(out.positions.A.autoQueue, "ux");
  // para Dev, só sai das filas
  const dev = plan([card("A", "Em DEV")], { positions, produto: ["A"] });
  assert.deepEqual(dev.filaProdutoOrder, []);
  assert.deepEqual(dev.filaUxOrder, []);
  assert.equal(dev.positions.A.autoQueue, "dev");
});

test("movido à mão depois da automação: a decisão manual vence, para sempre", () => {
  const positions = { A: { roadmapLane: null, startWeek: null, durationWeeks: 2, autoQueue: "produto" } };
  // tirou da fila de volta para Projetos
  assert.equal(plan([card("A", "Em design")], { positions }), null);
  // trocou de Produto para UX à mão
  assert.equal(plan([card("A", "Em análise")], { positions, ux: ["A"] }), null);
});

test("é idempotente: aplicar o plano e rodar de novo não muda mais nada", () => {
  const cards = [card("A", "Em análise"), card("B", "Em design"), card("C", "Em DEV")];
  const first = plan(cards);
  assert.equal(plan(cards, { positions: first.positions, produto: first.filaProdutoOrder, ux: first.filaUxOrder }), null);
});

test("não duplica: mesma chave repetida na lista de cards conta uma vez", () => {
  const out = plan([card("A", "Em análise"), card("A", "Em análise")]);
  assert.deepEqual(out.filaProdutoOrder, ["A"]);
  assert.equal(out.changes.length, 1);
});
