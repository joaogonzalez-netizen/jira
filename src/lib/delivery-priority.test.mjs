import { test } from "node:test";
import assert from "node:assert/strict";
import { comparePriority, mergePriority, reorderKeys } from "./delivery-priority.js";

const byKey = (a, b) => a.key.localeCompare(b.key);
const sorted = (keys, cardKeys) => keys.map((key) => ({ key })).sort(comparePriority(cardKeys, byKey)).map((c) => c.key);

test("sem lista, vale a ordem de reserva (status)", () => {
  assert.deepEqual(sorted(["C", "A", "B"], []), ["A", "B", "C"]);
});

test("quem está na lista vem primeiro, na ordem dela; o resto segue a reserva", () => {
  assert.deepEqual(sorted(["A", "B", "C", "D"], ["C", "A"]), ["C", "A", "B", "D"]);
});

test("reordenar põe o card antes ou depois do alvo", () => {
  const order = ["A", "B", "C", "D"];
  assert.deepEqual(reorderKeys(order, "D", "B", "before"), ["A", "D", "B", "C"]);
  assert.deepEqual(reorderKeys(order, "A", "C", "after"), ["B", "C", "A", "D"]);
  assert.deepEqual(reorderKeys(order, "B", "B", "before"), order);
  assert.deepEqual(reorderKeys(order, "X", "B", "before"), order);
  assert.deepEqual(reorderKeys(order, "A", "X", "after"), order);
});

test("não muta a lista recebida", () => {
  const order = ["A", "B", "C"];
  reorderKeys(order, "C", "A", "before");
  assert.deepEqual(order, ["A", "B", "C"]);
});

test("ao gravar, a ordem visível vem primeiro e o que já estava salvo é mantido atrás, sem repetir", () => {
  assert.deepEqual(mergePriority(["B", "A"], ["A", "Z", "B", "Y"]), ["B", "A", "Z", "Y"]);
  assert.deepEqual(mergePriority(["A", "B", "C"], [], 2), ["A", "B"]);
});
