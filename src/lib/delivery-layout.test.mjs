import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutFeatureRows, packRows } from "./delivery-layout.js";

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

test("layoutFeatureRows: a feature seguinte começa depois das linhas que a anterior ocupa de fato (cards previstos incluídos)", () => {
  // a 1ª feature tem 1 sub-linha de cards mas 8 cards em "Próximas entregas": ocupa 8 linhas
  const placed = layoutFeatureRows([
    { cards: [it("A", 0, 1)], upcomingCount: 8 },
    { cards: [it("B", 0, 0), it("C", 0, 0)], upcomingCount: 1 },
    { cards: [], upcomingCount: 0 },
  ]);
  assert.deepEqual(placed.map((p) => p.gridRow), [2, 10, 12]);
  assert.deepEqual(placed.map((p) => p.rowCount), [8, 2, 1]);
});

test("layoutFeatureRows: nenhuma linha da grade é usada por duas features", () => {
  const features = [
    { cards: [it("A", 0, 3), it("B", 1, 2)], upcomingCount: 5 },
    { cards: [it("C", 0, 0)], upcomingCount: 12 },
    { cards: [it("D", 0, 5), it("E", 0, 5), it("F", 0, 5)], upcomingCount: 0 },
    { cards: [], upcomingCount: 3 },
  ];
  const placed = layoutFeatureRows(features);
  const used = new Set();
  placed.forEach((p) => {
    for (let r = p.gridRow; r < p.gridRow + p.rowCount; r++) {
      assert.ok(!used.has(r), `linha ${r} usada duas vezes`);
      used.add(r);
    }
  });
  assert.equal(Math.min(...used), 2);
  assert.equal(Math.max(...used) - Math.min(...used) + 1, used.size); // sem vãos entre as features
});

test("layoutFeatureRows: o encaixe dos cards de cada feature segue o packRows; primeira linha configurável", () => {
  const [p] = layoutFeatureRows([{ cards: [it("A", 0, 2), it("B", 1, 3)], upcomingCount: 0 }], 5);
  assert.deepEqual(p.rowOf, { A: 0, B: 1 });
  assert.equal(p.rowCount, 2);
  assert.equal(p.gridRow, 5);
  assert.deepEqual(layoutFeatureRows([]), []);
});
