import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEpicHeader, fmtIsoBR, metricOf, periodOf } from "./epic-header.js";
import { cleanHeader } from "../server/epic-header.js";

test("fmtIsoBR e periodOf: datas no formato brasileiro, vazio quando não há", () => {
  assert.equal(fmtIsoBR("2027-01-15"), "15/01/2027");
  assert.equal(fmtIsoBR(""), "");
  assert.equal(fmtIsoBR(undefined), "");
  assert.equal(periodOf({ startDate: "2026-01-20", endDate: "2027-01-15" }), "20/01/26 → 15/01/27");
  assert.equal(periodOf({ endDate: "2027-01-15" }), "… → 15/01/27");
  assert.equal(periodOf({}), "");
  assert.equal(periodOf(null), "");
});

test("metricOf: atual / meta com a unidade, vírgula decimal; vazio sem os dois números", () => {
  assert.equal(metricOf({ current: 5.2, target: 4, unit: "%" }), "5,2% / 4%");
  assert.equal(metricOf({ current: 81, target: 100, unit: "R$ mi" }), "81 R$ mi / 100 R$ mi");
  assert.equal(metricOf({ current: 3, target: 6 }), "3 / 6");
  assert.equal(metricOf({ current: 3 }), "");
  assert.equal(metricOf(null), "");
});

test("buildEpicHeader: reúne objetivo, KR, oportunidade, solução e experimentos", () => {
  const h = buildEpicHeader({
    objective: { name: "Reduzir cancelamento", startDate: "2026-10-17", endDate: "2027-01-15" },
    keyResult: { name: "Churn", current: 5.2, target: 4, unit: "%", dueDate: "2027-01-15" },
    opportunity: { name: "Dor", description: "Evidência", links: [{ label: "Estudo", url: "https://a.com", extra: "x" }] },
    solution: { name: "Busca", description: "Como funciona" },
    experiments: [{ name: "Fake door", hypothesis: "10% clicam", status: "Concluído", outcome: "Validado", impact: 8 }],
    appUrl: "https://app.example.com",
  });
  assert.deepEqual(h.objective, { name: "Reduzir cancelamento", period: "17/10/26 → 15/01/27" });
  assert.deepEqual(h.keyResult, { name: "Churn", metric: "5,2% / 4%", due: "15/01/2027" });
  assert.deepEqual(h.opportunity.links, [{ label: "Estudo", url: "https://a.com" }]); // só o que o servidor usa
  assert.equal(h.experiments[0].outcome, "Validado");
  assert.ok(!("impact" in h.experiments[0]));
});

test("buildEpicHeader: o que o cliente monta passa na validação do servidor", () => {
  const full = buildEpicHeader({ objective: { name: "O" }, keyResult: { name: "K" }, opportunity: { name: "P", links: [] }, solution: { name: "S" }, experiments: [{ name: "E" }], appUrl: "https://a.com" });
  assert.equal(cleanHeader(full).ok, true);
  assert.equal(cleanHeader(buildEpicHeader({})).ok, false); // nada para mostrar
  assert.equal(cleanHeader(buildEpicHeader({ solution: { name: "Só a solução" } })).ok, true);
});
