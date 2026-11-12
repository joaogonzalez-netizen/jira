import { test } from "node:test";
import assert from "node:assert/strict";
import { packRows } from "./delivery-layout.js";

const it = (key, start, end) => ({ key, start, end });

test("cards que não se tocam dividem a mesma sub-linha", () => {
  const { rowOf, rowCount } = packRows([it("A", 0, 1), it("B", 2, 3), it("C", 4, 4)]);
  assert.deepEqual(rowOf, { A: 0, B: 0, C: 0 });
  assert.equal(rowCount, 1);
});

test("sobreposição em qualquer semana separa em sub-linhas, mesmo de um dia para o outro", () => {
  const { rowOf, rowCount } = packRows([it("A", 0, 2), it("B", 2, 4), it("C", 3, 3)]);
  assert.deepEqual(rowOf, { A: 0, B: 1, C: 0 }); // C (semana 3) cabe depois de A (0–2)
  assert.equal(rowCount, 2);
});

test("a ordem recebida manda: o primeiro fica em cima, mesmo começando depois", () => {
  const { rowOf } = packRows([it("tarde", 3, 5), it("cedo", 0, 4)]);
  assert.deepEqual(rowOf, { tarde: 0, cedo: 1 });
});

test("um card de várias semanas bloqueia todas elas; sem cards há ao menos uma sub-linha", () => {
  const { rowOf, rowCount } = packRows([it("A", 1, 4), it("B", 0, 0), it("C", 2, 2), it("D", 5, 5)]);
  assert.deepEqual(rowOf, { A: 0, B: 0, C: 1, D: 0 });
  assert.equal(rowCount, 2);
  assert.equal(packRows([]).rowCount, 1);
});
