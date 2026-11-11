import { test } from "node:test";
import assert from "node:assert/strict";
import { STATUS_BACK_TO_FRONT, byStatusBackToFront, statusRank } from "./status-order.js";

const card = (key, status, extra = {}) => ({ key, status, ...extra });
const order = (cards) => [...cards].sort(byStatusBackToFront).map((c) => c.key);

test("do mais avançado ao Backlog, na ordem da lista", () => {
  const shuffled = [...STATUS_BACK_TO_FRONT].reverse().map((names, i) => card(`K-${i}`, names[0]));
  const sorted = [...shuffled].sort(byStatusBackToFront).map((c) => c.status);
  assert.deepEqual(sorted, STATUS_BACK_TO_FRONT.map((names) => names[0]));
});

test("cada status distinto é um degrau: nada de status diferente intercalado", () => {
  const sorted = [card("A", "Fila da Sprint"), card("B", "Fila da sprint UX"), card("C", "Fila da Sprint"), card("D", "Fila da sprint UX")]
    .sort(byStatusBackToFront).map((c) => c.status);
  assert.deepEqual(sorted, ["Fila da Sprint", "Fila da Sprint", "Fila da sprint UX", "Fila da sprint UX"]);
});

test("grafias do quadro do Jira valem o mesmo que as da planilha", () => {
  assert.equal(statusRank(card("A", "Aguardando suporte")), statusRank(card("B", "Aguardado suporte")));
  assert.equal(statusRank(card("A", "Pronto para testes")), statusRank(card("B", "Pronta p/ teste")));
  assert.equal(statusRank(card("A", "CONCLUÍDO")), statusRank(card("B", "Done")));
  assert.equal(statusRank(card("A", "  pronto p/ deploy ")), statusRank(card("B", "Pronto para deploy")));
});

test("Candidato Próximo Trimestre não tem degrau próprio: fica junto do Backlog pela etapa", () => {
  const candidato = card("A", "Candidato Próximo Trimestre", { stage: "Backlog" });
  assert.equal(statusRank(candidato), statusRank(card("B", "Backlog")));
  assert.deepEqual(order([card("C", "Backlog"), candidato, card("D", "Em design")]), ["D", "A", "C"]);
});

test("status que a lista não conhece entra pela etapa; sem nada, vai para o fim", () => {
  assert.equal(statusRank(card("A", "Status novo", { stage: "Em dev" })), statusRank(card("B", "Em DEV")));
  assert.equal(statusRank(card("A", "Status novo")), STATUS_BACK_TO_FRONT.length);
  assert.deepEqual(order([card("A", "Backlog"), card("B", "Status novo"), card("C", "Done")]), ["C", "A", "B"]);
});

test("mesmo status: conclusão mais recente primeiro, depois a chave", () => {
  const out = order([
    card("S-10", "Done", { dataConcl: "01/11/2026" }),
    card("S-2", "Done", { dataConcl: "05/11/2026" }),
    card("S-3", "Em DEV"),
    card("S-1", "Em DEV"),
  ]);
  assert.deepEqual(out, ["S-2", "S-10", "S-1", "S-3"]);
});
