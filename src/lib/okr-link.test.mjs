import { test } from "node:test";
import assert from "node:assert/strict";
import { NO_LINK, buildOkrLanes, matchesOkrFilter, okrCoverage, okrOf } from "./okr-link.js";

const objectives = [{ id: "o1", name: "Reduzir churn" }, { id: "o2", name: "Ativar vendedores" }];
const keyResults = [
  { id: "k1", name: "Churn de 6% para 4%", objectiveId: "o1", epicKeys: ["FLIX-1", "FLIX-2"] },
  { id: "k2", name: "Ativação de 22% para 40%", objectiveId: "o2", epicKeys: ["SELLER-1"] },
  { id: "k3", name: "KR de objetivo apagado", objectiveId: "sumiu", epicKeys: ["IA-1"] },
  { id: "k4", name: "Sem card agendado", objectiveId: "o1", epicKeys: [] },
];
const krByEpic = {};
keyResults.forEach((kr) => kr.epicKeys.forEach((k) => { krByEpic[k] = kr; }));
const objectiveById = Object.fromEntries(objectives.map((o) => [o.id, o]));
const ctx = { objectives, keyResults, krByEpic, objectiveById };
const card = (key, extra = {}) => ({ key, ...extra });

test("okrOf: épico ligado ao KR devolve KR e objetivo", () => {
  const link = okrOf(card("FLIX-1"), ctx);
  assert.equal(link.kr.id, "k1");
  assert.equal(link.objective.id, "o1");
});

test("okrOf: tarefa herda o KR do épico pai; sem vínculo devolve null", () => {
  assert.equal(okrOf(card("FLIX-9", { parent: "FLIX-2" }), ctx).kr.id, "k1");
  assert.equal(okrOf(card("FLIX-9", { parent: "FLIX-77" }), ctx), null);
  assert.equal(okrOf(card("LOJA-5"), ctx), null);
  assert.equal(okrOf(null, ctx), null);
});

test("okrOf: o vínculo do próprio card vale mais que o do pai", () => {
  assert.equal(okrOf(card("SELLER-1", { parent: "FLIX-1" }), ctx).kr.id, "k2");
});

test("okrOf: KR de objetivo que não existe mais devolve objective null", () => {
  const link = okrOf(card("IA-1"), ctx);
  assert.equal(link.kr.id, "k3");
  assert.equal(link.objective, null);
});

test("matchesOkrFilter: todos, sem vínculo, objetivo e KR", () => {
  const a = okrOf(card("FLIX-1"), ctx);
  const none = null;
  assert.equal(matchesOkrFilter(a, "all"), true);
  assert.equal(matchesOkrFilter(none, "all"), true);
  assert.equal(matchesOkrFilter(a, undefined), true);
  assert.equal(matchesOkrFilter(none, "none"), true);
  assert.equal(matchesOkrFilter(a, "none"), false);
  assert.equal(matchesOkrFilter(a, "kr:k1"), true);
  assert.equal(matchesOkrFilter(a, "kr:k2"), false);
  assert.equal(matchesOkrFilter(none, "kr:k1"), false);
  assert.equal(matchesOkrFilter(a, "obj:o1"), true);
  assert.equal(matchesOkrFilter(a, "obj:o2"), false);
  assert.equal(matchesOkrFilter(okrOf(card("IA-1"), ctx), "obj:o1"), false); // objetivo apagado não casa com objetivo nenhum
  assert.equal(matchesOkrFilter(a, "qualquer-coisa"), true);
});

test("buildOkrLanes: KRs na ordem dos objetivos, só com card, e Sem vínculo sempre por último", () => {
  const items = [card("SELLER-1"), card("FLIX-2"), card("FLIX-1"), card("LOJA-5"), card("IA-1"), card("FLIX-9", { parent: "FLIX-1" })];
  const lanes = buildOkrLanes(items, ctx);
  assert.deepEqual(lanes.map((l) => l.key), ["kr:k1", "kr:k2", "kr:k3", NO_LINK]);
  assert.deepEqual(lanes[0].items.map((i) => i.key), ["FLIX-2", "FLIX-1", "FLIX-9"]);
  assert.equal(lanes[0].caption, "Reduzir churn");
  assert.equal(lanes[1].caption, "Ativar vendedores");
  assert.equal(lanes[2].caption, ""); // objetivo apagado
  assert.deepEqual(lanes[3].items.map((i) => i.key), ["LOJA-5"]);
});

test("buildOkrLanes: sem nenhum card ainda devolve só Sem vínculo, vazia", () => {
  const lanes = buildOkrLanes([], ctx);
  assert.deepEqual(lanes.map((l) => l.key), [NO_LINK]);
  assert.deepEqual(lanes[0].items, []);
});

test("buildOkrLanes: KR sem nome ganha rótulo; um card nunca aparece em duas raias", () => {
  const ctx2 = { ...ctx, keyResults: [{ id: "k9", name: "", objectiveId: "o1", epicKeys: ["X-1"] }], krByEpic: { "X-1": { id: "k9", name: "", objectiveId: "o1" } } };
  const lanes = buildOkrLanes([card("X-1")], ctx2);
  assert.equal(lanes[0].label, "Key Result sem nome");
  assert.equal(lanes.flatMap((l) => l.items).length, 1);
});

test("okrCoverage conta quantos cards têm KR", () => {
  assert.deepEqual(okrCoverage([card("FLIX-1"), card("LOJA-5"), card("X", { parent: "FLIX-2" })], ctx), { linked: 2, total: 3 });
  assert.deepEqual(okrCoverage([], ctx), { linked: 0, total: 0 });
});
