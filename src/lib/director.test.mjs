import { test } from "node:test";
import assert from "node:assert/strict";
import {
  epicHealth, funnel, krHealth, krProgress, objectiveHealth, quarterOf, quarterTimeline, recentDeliveries, scheduleEnd, stageOf, timelineQuarters, withoutKr,
} from "./director.js";

// quarta-feira, 18/11/2026 (a segunda dessa semana é 16/11)
const NOW = new Date(2026, 10, 18);
const objective = { id: "o1", startDate: "2026-10-01" };
const kr = (extra = {}) => ({ id: "k1", status: "Em andamento", baseline: 0, target: 100, current: 50, dueDate: "2026-12-31", checkins: [], ...extra });
const health = (extra, ctx = { objective, now: NOW }) => krHealth(kr(extra), ctx);

test("krProgress: 0–100, nulo sem números ou com início = meta", () => {
  assert.equal(krProgress({ baseline: 6, target: 4, current: 5 }), 50); // meta menor que o início também vale
  assert.equal(krProgress({ baseline: 0, target: 100, current: 150 }), 100);
  assert.equal(krProgress({ baseline: 0, target: 100, current: -5 }), 0);
  assert.equal(krProgress({ baseline: 0, target: 100 }), null);
  assert.equal(krProgress({ baseline: 5, target: 5, current: 5 }), null);
});

test("krHealth: atingido por status ou por progresso", () => {
  assert.equal(health({ status: "Concluído" }).health, "done");
  assert.equal(health({ current: 100 }).health, "done");
});

test("krHealth: planejado, não iniciado e pausado não são avaliados", () => {
  assert.equal(health({ status: "Planejado" }).health, "idle");
  assert.equal(health({ status: "Pausado" }).health, "idle");
  const notStarted = health({ status: "Não iniciado", dueDate: "2020-01-01" }); // nem o prazo velho o torna atrasado
  assert.equal(notStarted.health, "idle");
  assert.equal(notStarted.reason, "Não iniciado");
});

test("krHealth: prazo vencido sem atingir é atrasado, com a data no motivo", () => {
  const r = health({ dueDate: "2026-11-10" });
  assert.equal(r.health, "late");
  assert.match(r.reason, /10\/11/);
  assert.equal(health({ dueDate: "2026-11-18" }).health === "late", false); // vence hoje: ainda dá tempo
});

test("krHealth: abaixo do ritmo linear (15 pontos de tolerância) é em risco", () => {
  // 01/10 → 31/12: em 18/11 passaram ~53% do prazo
  const r = health({ current: 30 });
  assert.equal(r.health, "risk");
  assert.match(r.reason, /Abaixo do ritmo/);
  assert.equal(health({ current: 40 }).health, "on_track"); // 40% ≥ 53% − 15
  assert.equal(health({ current: 38 }).health, "on_track");
  assert.equal(health({ current: 37 }).health, "risk");
});

test("krHealth: check-in parado há mais de duas semanas é em risco, mesmo no ritmo", () => {
  const r = health({ current: 60, checkins: [{ week: "2026-10-12", value: 55 }, { week: "2026-10-26", value: 60 }] });
  assert.equal(r.health, "risk");
  assert.match(r.reason, /Sem check-in desde 26\/10/);
  assert.equal(health({ current: 60, checkins: [{ week: "2026-11-09", value: 60 }] }).health, "on_track");
});

test("krHealth: sem início no objetivo, o ritmo parte do primeiro check-in", () => {
  const noStart = { objective: { id: "o1" }, now: NOW };
  const r = krHealth(kr({ current: 5, checkins: [{ week: "2026-10-05", value: 0 }, { week: "2026-11-16", value: 5 }] }), noStart);
  assert.equal(r.health, "risk"); // 5% feito, ~47% do prazo passou
  const none = krHealth(kr({ current: 5 }), noStart); // sem início nenhum: só dá para checar o prazo
  assert.equal(none.expected, null);
  assert.equal(none.health, "on_track");
});

test("krHealth: sem números para medir é não avaliado", () => {
  assert.equal(health({ baseline: undefined, current: undefined }).health, "idle");
});

test("objectiveHealth: o pior KR avaliado manda; tudo atingido é done; nada avaliável é idle", () => {
  assert.equal(objectiveHealth(["on_track", "risk", "done"]), "risk");
  assert.equal(objectiveHealth(["on_track", "late", "risk"]), "late");
  assert.equal(objectiveHealth(["on_track", "idle"]), "on_track");
  assert.equal(objectiveHealth(["done", "done"]), "done");
  assert.equal(objectiveHealth(["idle", "done"]), "idle"); // só vira done quando todos estão atingidos
  assert.equal(objectiveHealth([]), "idle");
});

test("scheduleEnd: último dia da semana final da barra, relativo à semana atual", () => {
  const end = scheduleEnd({ roadmapLane: "STLFLIX", startWeek: 0, durationWeeks: 2 }, NOW);
  assert.equal(end.toDateString(), new Date(2026, 10, 29).toDateString()); // domingo 29/11
  assert.equal(scheduleEnd({ roadmapLane: null, startWeek: null }, NOW), null);
  assert.equal(scheduleEnd(undefined, NOW), null);
  assert.equal(scheduleEnd({ roadmapLane: "X", startWeek: -3, durationWeeks: 1 }, NOW).toDateString(), new Date(2026, 10, 1).toDateString()); // semana de 26/10 termina em 01/11
});

test("epicHealth: concluído, atrasado, no prazo e sem data", () => {
  const open = { key: "A", status: "Em DEV" };
  assert.equal(epicHealth({ key: "A", status: "Done" }, undefined, NOW), "done");
  assert.equal(epicHealth(open, { roadmapLane: "X", startWeek: -4, durationWeeks: 2 }, NOW), "late");
  assert.equal(epicHealth(open, { roadmapLane: "X", startWeek: -1, durationWeeks: 2 }, NOW), "on_track"); // termina nesta semana
  assert.equal(epicHealth(open, { roadmapLane: "X", startWeek: 0, durationWeeks: 4 }, NOW), "on_track");
  assert.equal(epicHealth(open, undefined, NOW), "unscheduled");
});

test("stageOf: fila posta à mão vale mais que o status; depois status e projeto", () => {
  const q = { filaProdutoOrder: ["P"], filaUxOrder: ["U"] };
  assert.equal(stageOf({ key: "P", status: "Em DEV", project: "STLFLIX" }, q), "produto");
  assert.equal(stageOf({ key: "U", status: "Backlog", project: "STLFLIX" }, q), "ux");
  assert.equal(stageOf({ key: "O", status: "Backlog", project: "ProductOps" }, q), "backlog"); // ProductOps não tem fila própria
  assert.equal(stageOf({ key: "x", status: "Em análise", project: "STL Seller" }, q), "produto");
  assert.equal(stageOf({ key: "x", status: "[UX] Em andamento", project: "STLFLIX" }, q), "ux");
  assert.equal(stageOf({ key: "x", status: "Em refinamento Técnico", project: "STL IA" }, q), "tech");
  assert.equal(stageOf({ key: "x", status: "Pronto P/ DEV", project: "STL IA" }, q), "ready");
  assert.equal(stageOf({ key: "x", status: "Em DEV", project: "STL IA" }, q), "dev");
  assert.equal(stageOf({ key: "x", status: "Code Review", project: "STL IA" }, q), "dev");
  assert.equal(stageOf({ key: "x", status: "Em rollout", project: "STL IA" }, q), "rollout");
  assert.equal(stageOf({ key: "x", status: "Backlog", project: "STL IA" }, q), "backlog");
  assert.equal(stageOf({ key: "x", status: "Qualquer coisa", project: "STL IA" }, {}), "backlog");
});

test("funnel: conta só o que está em aberto, na ordem do funil, com os itens", () => {
  const cards = [
    { key: "1", status: "Backlog", project: "STL IA" },
    { key: "2", status: "Backlog", project: "STL IA" },
    { key: "3", status: "Em DEV", project: "STL IA" },
    { key: "4", status: "Done", project: "STL IA" },
    { key: "5", status: "Em análise", project: "STL IA" },
  ];
  const f = funnel(cards, {});
  assert.deepEqual(f.map((s) => s.key), ["backlog", "produto", "ux", "tech", "ready", "dev", "rollout"]);
  assert.deepEqual(Object.fromEntries(f.map((s) => [s.key, s.count])), { backlog: 2, produto: 1, ux: 0, tech: 0, ready: 0, dev: 1, rollout: 0 });
  assert.deepEqual(f[0].items.map((c) => c.key), ["1", "2"]);
});

test("withoutKr: só o que já anda (fora do Backlog e não concluído) e não tem KR", () => {
  const cards = [
    { key: "a", status: "Em DEV", project: "X" },
    { key: "b", status: "Em DEV", project: "X" },
    { key: "c", status: "Backlog", project: "X" },
    { key: "d", status: "Done", project: "X" },
  ];
  assert.deepEqual(withoutKr(cards, {}, (c) => c.key === "b").map((c) => c.key), ["a"]);
});

test("trimestres: anterior, atual e dois seguintes, com o atual marcado", () => {
  const cols = timelineQuarters(NOW);
  assert.deepEqual(cols.map((c) => c.label), ["Q3/26", "Q4/26", "Q1/27", "Q2/27"]);
  assert.deepEqual(cols.map((c) => c.isCurrent), [false, true, false, false]);
  assert.equal(quarterOf(new Date(2026, 0, 1)).key, "2026-Q1");
  assert.equal(quarterOf(new Date(2026, 11, 31)).key, "2026-Q4");
});

test("quarterTimeline: agrupa por produto e trimestre; ignora sem data, fora da janela e sem projeto", () => {
  const cards = [
    { key: "a", project: "STLFLIX", status: "Em DEV", summary: "A" },
    { key: "b", project: "STLFLIX", status: "Em DEV", summary: "B" },
    { key: "c", project: "STL IA", status: "Done", summary: "C", dataConcl: "20/09/2026" },
    { key: "d", project: "STL IA", status: "Em DEV", summary: "D" },
    { key: "e", project: "STL IA", status: "Em DEV", summary: "E" },
    { key: "f", status: "Em DEV", summary: "F" },
  ];
  const positions = {
    a: { roadmapLane: "STLFLIX", startWeek: 0, durationWeeks: 2 }, // termina em 29/11 -> Q4
    b: { roadmapLane: "STLFLIX", startWeek: 10, durationWeeks: 4 }, // fim em fevereiro -> Q1/27
    d: { roadmapLane: "STL IA", startWeek: 60, durationWeeks: 2 }, // longe demais
    f: { roadmapLane: "X", startWeek: 0, durationWeeks: 1 },
  };
  const t = quarterTimeline(cards, positions, { now: NOW, products: ["STLFLIX", "STL IA"] });
  assert.deepEqual(t.rows.map((r) => r.product), ["STLFLIX", "STL IA"]);
  assert.deepEqual(t.rows[0].cells["2026-Q4"].map((c) => c.key), ["a"]);
  assert.deepEqual(t.rows[0].cells["2027-Q1"].map((c) => c.key), ["b"]);
  assert.deepEqual(t.rows[1].cells["2026-Q3"].map((c) => c.key), ["c"]); // entregue em setembro
  assert.equal(t.rows[1].cells["2026-Q3"][0].health, "done");
  assert.equal(JSON.stringify(t.rows).includes('"key":"e"'), false);
  assert.equal(JSON.stringify(t.rows).includes('"key":"f"'), false);
});

test("quarterTimeline: produto fora da lista entra no fim, em ordem alfabética", () => {
  const cards = [{ key: "a", project: "Zeta", status: "Em DEV" }, { key: "b", project: "Alfa", status: "Em DEV" }, { key: "c", project: "STLFLIX", status: "Em DEV" }];
  const positions = Object.fromEntries(cards.map((c) => [c.key, { roadmapLane: c.project, startWeek: 0, durationWeeks: 1 }]));
  const t = quarterTimeline(cards, positions, { now: NOW, products: ["STLFLIX"] });
  assert.deepEqual(t.rows.map((r) => r.product), ["STLFLIX", "Alfa", "Zeta"]);
});

test("recentDeliveries: só concluídos na janela, mais recentes primeiro, com limite; data escolhida à mão vale", () => {
  const cards = [
    { key: "a", status: "Done", dataConcl: "10/11/2026" },
    { key: "b", status: "Done", dataConcl: "01/11/2026" },
    { key: "c", status: "Done", dataConcl: "01/01/2026" }, // fora da janela
    { key: "d", status: "Em DEV", dataConcl: "10/11/2026" }, // não concluído
    { key: "e", status: "Done", dataConcl: "01/01/2026" }, // data à mão traz para dentro
    { key: "f", status: "Done" }, // sem data
  ];
  const positions = { e: { doneWeek: "2026-11-16" } };
  const r = recentDeliveries(cards, positions, { now: NOW, weeks: 6, limit: 10 });
  assert.deepEqual(r.map((x) => x.card.key), ["e", "a", "b"]);
  assert.equal(recentDeliveries(cards, positions, { now: NOW, weeks: 6, limit: 1 }).length, 1);
});
