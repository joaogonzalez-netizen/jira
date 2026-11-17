import { test } from "node:test";
import assert from "node:assert/strict";
import { barGeometry, buildOkrGantt, fractionOf, krSpan, monthsBetween, objectiveSpan, quarterStart, timeRange } from "./okr-gantt.js";

const D = (y, m, d) => new Date(y, m - 1, d);
const TODAY = D(2026, 11, 18);
const OBJ = { id: "o1", name: "Reduzir cancelamento", startDate: "2026-10-01", endDate: "2027-01-31" };
const kr = (extra = {}) => ({ id: "k1", name: "Churn", objectiveId: "o1", status: "Em andamento", baseline: 6, target: 4, current: 5, dueDate: "2026-12-31", checkins: [], ...extra });
const same = (a, b) => assert.equal(a.toDateString(), b.toDateString());

test("quarterStart: 1º dia do trimestre; formato inválido é null", () => {
  same(quarterStart("Q4/2026"), D(2026, 10, 1));
  same(quarterStart("Q1/2027"), D(2027, 1, 1));
  assert.equal(quarterStart("Q5/2026"), null);
  assert.equal(quarterStart(""), null);
  assert.equal(quarterStart(undefined), null);
});

test("krSpan: do início do objetivo ao prazo do KR", () => {
  const s = krSpan(kr(), OBJ);
  same(s.start, D(2026, 10, 1));
  same(s.end, D(2026, 12, 31));
});

test("krSpan: sem início no objetivo, usa o primeiro check-in, depois o trimestre, depois 90 dias antes", () => {
  const noStart = { id: "o1" };
  same(krSpan(kr({ checkins: [{ week: "2026-10-12", value: 5.5 }] }), noStart).start, D(2026, 10, 12));
  same(krSpan(kr({ quarter: "Q4/2026" }), noStart).start, D(2026, 10, 1));
  same(krSpan(kr(), noStart).start, D(2026, 10, 2)); // 31/12 − 90 dias
});

test("krSpan: sem prazo usa o fim do objetivo; sem nenhum dos dois não tem barra", () => {
  same(krSpan(kr({ dueDate: undefined }), OBJ).end, D(2027, 1, 31));
  assert.equal(krSpan(kr({ dueDate: undefined }), { id: "o1", startDate: "2026-10-01" }), null);
  assert.equal(krSpan(kr({ dueDate: "" }), null), null);
});

test("krSpan: prazo antes do início não inverte a barra (vira uma semana)", () => {
  const s = krSpan(kr({ dueDate: "2026-09-01" }), OBJ);
  same(s.start, D(2026, 10, 1));
  same(s.end, D(2026, 10, 8));
});

test("objectiveSpan: usa as datas dele e, faltando uma, a dos KRs", () => {
  const a = objectiveSpan(OBJ, [{ start: D(2026, 11, 1), end: D(2026, 12, 1) }]);
  same(a.start, D(2026, 10, 1));
  same(a.end, D(2027, 1, 31));
  const b = objectiveSpan({ id: "x" }, [{ start: D(2026, 11, 1), end: D(2026, 12, 1) }, { start: D(2026, 10, 15), end: D(2027, 2, 10) }, null]);
  same(b.start, D(2026, 10, 15));
  same(b.end, D(2027, 2, 10));
  assert.equal(objectiveSpan({ id: "x" }, [null]), null);
});

test("monthsBetween: meses inteiros com rótulo curto", () => {
  const m = monthsBetween(D(2026, 11, 18), D(2027, 1, 5));
  assert.deepEqual(m.map((x) => x.label), ["nov/26", "dez/26", "jan/27"]);
  assert.deepEqual(m.map((x) => x.key), ["2026-11", "2026-12", "2027-01"]);
  same(m[0].end, D(2026, 12, 1));
});

test("timeRange: cobre as barras e hoje, em meses inteiros, com no mínimo seis meses", () => {
  const r = timeRange([{ start: D(2026, 11, 3), end: D(2026, 12, 20) }], TODAY);
  same(r.start, D(2026, 11, 1));
  assert.equal(monthsBetween(r.start, new Date(r.end - 1)).length, 6);
  const wide = timeRange([{ start: D(2026, 1, 15), end: D(2027, 6, 2) }], TODAY);
  same(wide.start, D(2026, 1, 1));
  same(wide.end, D(2027, 7, 1));
  // hoje fora das barras também entra na janela
  same(timeRange([{ start: D(2027, 3, 1), end: D(2027, 4, 1) }], TODAY).start, D(2026, 11, 1));
  same(timeRange([], TODAY).start, D(2026, 11, 1)); // sem barra nenhuma ainda dá uma janela
});

test("barGeometry: frações da janela, cortadas nas pontas e com largura mínima", () => {
  const range = { start: D(2026, 1, 1), end: D(2026, 1, 11) }; // 10 dias
  const g = barGeometry({ start: D(2026, 1, 3), end: D(2026, 1, 8) }, range);
  assert.ok(Math.abs(g.left - 0.2) < 1e-9 && Math.abs(g.width - 0.5) < 1e-9);
  const clipped = barGeometry({ start: D(2025, 12, 1), end: D(2026, 3, 1) }, range);
  assert.equal(clipped.left, 0);
  assert.equal(clipped.width, 1);
  assert.ok(barGeometry({ start: D(2026, 1, 5), end: D(2026, 1, 5) }, range).width >= 0.004);
  assert.ok(Math.abs(fractionOf(D(2026, 1, 6), range) - 0.5) < 1e-9);
});

test("buildOkrGantt: objetivo seguido dos seus KRs, saúde e progresso, janela e linha de hoje", () => {
  const g = buildOkrGantt({ objectives: [OBJ], keyResults: [kr(), kr({ id: "k2", name: "Downloads", dueDate: "2026-11-01", current: 5 })], today: TODAY });
  assert.deepEqual(g.rows.map((r) => `${r.type}:${r.id}`), ["objective:o1", "kr:k1", "kr:k2"]);
  assert.equal(g.rows[2].health, "late"); // prazo de 01/11 já passou
  assert.equal(g.rows[1].progress, 50);
  assert.equal(g.rows[0].health, "late"); // o pior KR manda
  assert.ok(g.todayFraction > 0 && g.todayFraction < 1);
  assert.ok(g.months.length >= 6);
  assert.equal(g.undated.length, 0);
});

test("buildOkrGantt: KR sem prazo fica sem barra mas aparece; objetivo sem data nenhuma vai para undated", () => {
  const noDates = { id: "o2", name: "Sem datas" };
  const g = buildOkrGantt({ objectives: [OBJ, noDates], keyResults: [kr({ id: "k3", dueDate: undefined }), kr({ id: "k4", objectiveId: "o2", dueDate: undefined })], today: TODAY });
  assert.deepEqual(g.undated.map((o) => o.id), ["o2"]);
  assert.deepEqual(g.rows.filter((r) => r.type === "kr").map((r) => r.id), ["k3"]);
  assert.ok(g.rows.find((r) => r.id === "k3").span); // herdou o fim do objetivo
  // com um KR que tem prazo, o objetivo sem datas ganha o período dos KRs e não vai para undated
  const derived = buildOkrGantt({ objectives: [noDates], keyResults: [kr({ id: "k5", objectiveId: "o2" })], today: TODAY });
  assert.equal(derived.undated.length, 0);
  assert.equal(derived.rows[0].type, "objective");
});

test("buildOkrGantt: os épicos agendados só entram com showEpics e só os que têm datas", () => {
  const epics = [{ key: "FLIX-1", summary: "A", start: D(2026, 11, 2), end: D(2026, 11, 29), health: "on_track" }, { key: "FLIX-2", summary: "Sem data", start: null, end: null, health: "unscheduled" }];
  const args = { objectives: [OBJ], keyResults: [kr()], today: TODAY, epicsOfKr: () => epics };
  assert.equal(buildOkrGantt(args).rows.some((r) => r.type === "epic"), false);
  const shown = buildOkrGantt({ ...args, showEpics: true }).rows.filter((r) => r.type === "epic");
  assert.deepEqual(shown.map((r) => r.item.key), ["FLIX-1"]);
  assert.equal(shown[0].id, "k1:FLIX-1");
});

test("buildOkrGantt: nada cadastrado devolve uma janela vazia, sem quebrar", () => {
  const g = buildOkrGantt({ objectives: [], keyResults: [], today: TODAY });
  assert.deepEqual(g.rows, []);
  assert.ok(g.months.length >= 6);
});

test("buildOkrGantt: KR Não iniciado fica fora do Gantt (e os épicos dele); os outros status entram", () => {
  const statuses = ["Em andamento", "Planejado", "Pausado", "Concluído", "Não iniciado"];
  const keyResults = statuses.map((status, i) => kr({ id: `k${i}`, name: status, status }));
  const epics = [{ key: "FLIX-1", summary: "A", start: D(2026, 11, 2), end: D(2026, 11, 29), health: "on_track" }];
  const g = buildOkrGantt({ objectives: [OBJ], keyResults, today: TODAY, epicsOfKr: () => epics, showEpics: true });
  const krRows = g.rows.filter((r) => r.type === "kr").map((r) => r.item.status);
  assert.deepEqual(krRows, ["Em andamento", "Planejado", "Pausado", "Concluído"]);
  assert.equal(g.rows.filter((r) => r.type === "epic").length, 4); // 1 por KR que está no gráfico, nenhum do Não iniciado
});

test("buildOkrGantt: objetivo com todos os KRs Não iniciado continua com a barra dele quando tem datas; sem datas vai para undated", () => {
  const onlyNotStarted = [kr({ id: "a", status: "Não iniciado" }), kr({ id: "b", status: "Não iniciado" })];
  const dated = buildOkrGantt({ objectives: [OBJ], keyResults: onlyNotStarted, today: TODAY });
  assert.deepEqual(dated.rows.map((r) => r.type), ["objective"]);
  assert.equal(dated.rows[0].health, "idle"); // nenhum KR avaliado
  const undated = buildOkrGantt({ objectives: [{ id: "o1", name: "Sem datas" }], keyResults: onlyNotStarted, today: TODAY });
  assert.deepEqual(undated.undated.map((o) => o.id), ["o1"]);
  assert.deepEqual(undated.rows, []);
});
