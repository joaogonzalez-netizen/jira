import { test } from "node:test";
import assert from "node:assert/strict";
import { applyOrder, moveTarget } from "./reorder.js";

const ids = ["a", "b", "c", "d"];

test("moveTarget: subir vai antes do vizinho de cima, descer vai depois do de baixo", () => {
  assert.deepEqual(moveTarget(ids, "c", "up"), { relativeTo: "b", position: "before" });
  assert.deepEqual(moveTarget(ids, "b", "down"), { relativeTo: "c", position: "after" });
});

test("moveTarget: na ponta da lista não há para onde ir", () => {
  assert.equal(moveTarget(ids, "a", "up"), null);
  assert.equal(moveTarget(ids, "d", "down"), null);
  assert.equal(moveTarget(["só"], "só", "up"), null);
});

test("moveTarget: item que não está na lista, ou direção inválida, é ignorado", () => {
  assert.equal(moveTarget(ids, "x", "up"), null);
  assert.equal(moveTarget(ids, "b", "lado"), null);
  assert.equal(moveTarget([], "a", "down"), null);
});

test("moveTarget: com filtro, o vizinho é o visível (pula o que está escondido)", () => {
  // a lista completa é a, b, c, d; o filtro mostra só a e d
  assert.deepEqual(moveTarget(["a", "d"], "d", "up"), { relativeTo: "a", position: "before" });
});

test("applyOrder: ordena pela lista de ids; o que não foi citado vai para o fim, sem se mexer", () => {
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  assert.deepEqual(applyOrder(list, ["c", "a", "b", "d"]).map((x) => x.id), ["c", "a", "b", "d"]);
  assert.deepEqual(applyOrder(list, ["d", "b"]).map((x) => x.id), ["d", "b", "a", "c"]);
  assert.deepEqual(applyOrder(list, []).map((x) => x.id), ["a", "b", "c", "d"]);
  assert.equal(list[0].id, "a"); // não muda a lista original
});
