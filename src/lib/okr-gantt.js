/**
 * Gantt de Objetivos e Key Results: as barras no tempo, sem React. Cada
 * objetivo vira uma barra (período dele); cada KR, uma barra do início do
 * objetivo até o prazo do KR, preenchida até o progresso e colorida pela saúde.
 * Opcionalmente, os épicos agendados no Roadmap aparecem sob o KR a que pertencem.
 */
import { krHealth, objectiveHealth } from "./director.js";

const DAY = 86400000;
/** KR que ainda não começou não tem barra: o Gantt mostra só o que já está em curso, planejado, pausado ou concluído. */
const NOT_STARTED = new Set(["Não iniciado"]);
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const isoToDate = (iso) => {
  const m = typeof iso === "string" && iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const firstOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

/** "Q4/2026" -> 1º de outubro de 2026; null se o formato não bate. */
export function quarterStart(quarter) {
  const m = typeof quarter === "string" && quarter.match(/^Q([1-4])\/(\d{4})$/);
  return m ? new Date(Number(m[2]), (Number(m[1]) - 1) * 3, 1) : null;
}

/** Um intervalo bem formado: o fim nunca fica antes do início (no mínimo uma semana de barra). */
function span(start, end) {
  if (!start || !end) return null;
  return end >= start ? { start, end } : { start, end: addDays(start, 7) };
}

/**
 * Período de um KR no tempo. Início: o do objetivo; sem ele, o primeiro check-in; sem ele, o início do
 * trimestre do KR; sem nada, 90 dias antes do fim. Fim: o prazo do KR; sem prazo, o fim do objetivo.
 * `null` quando não há fim nenhum (KR sem prazo, objetivo sem fim): fica de fora das barras.
 */
export function krSpan(kr, objective = null) {
  const end = isoToDate(kr.dueDate) || isoToDate(objective && objective.endDate);
  if (!end) return null;
  const checkins = Array.isArray(kr.checkins) ? kr.checkins : [];
  const start = isoToDate(objective && objective.startDate) || (checkins.length ? isoToDate(checkins[0].week) : null) || quarterStart(kr.quarter) || addDays(end, -90);
  return span(start, end);
}

/** Período do objetivo: as datas dele; faltando uma ponta, a dos seus KRs (a mais cedo / a mais tarde). */
export function objectiveSpan(objective, krSpans) {
  const valid = krSpans.filter(Boolean);
  const start = isoToDate(objective.startDate) || (valid.length ? new Date(Math.min(...valid.map((s) => s.start))) : null);
  const end = isoToDate(objective.endDate) || (valid.length ? new Date(Math.max(...valid.map((s) => s.end))) : null);
  return span(start, end);
}

/** Meses (do 1º ao 1º do seguinte) que cobrem [start, end]. */
export function monthsBetween(start, end) {
  const out = [];
  for (let m = firstOfMonth(start); m <= end; m = addMonths(m, 1)) {
    out.push({ key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`, label: `${MONTHS[m.getMonth()]}/${String(m.getFullYear()).slice(2)}`, start: m, end: addMonths(m, 1) });
  }
  return out;
}

/** Janela do gráfico: tudo o que há de barra, hoje, e no mínimo seis meses, sempre em meses inteiros. */
export function timeRange(spans, today, minMonths = 6) {
  const points = [today, ...spans.filter(Boolean).flatMap((s) => [s.start, s.end])];
  const start = firstOfMonth(new Date(Math.min(...points)));
  let end = addMonths(firstOfMonth(new Date(Math.max(...points))), 1);
  while (monthsBetween(start, addDays(end, -1)).length < minMonths) end = addMonths(end, 1);
  return { start, end };
}

/** Posição da barra na janela, em frações de 0 a 1 (largura mínima para uma barra curta não sumir). */
export function barGeometry(s, range) {
  const total = range.end - range.start;
  const left = Math.max(0, (s.start - range.start) / total);
  const right = Math.min(1, (s.end - range.start) / total);
  return { left, width: Math.max(right - left, 0.004) };
}

export const fractionOf = (date, range) => (date - range.start) / (range.end - range.start);

/**
 * Linhas do Gantt, na ordem em que aparecem. `epicsOfKr(kr)` (opcional) devolve os épicos agendados do KR
 * como `{ key, summary, start, end, health }`; só entram quando `showEpics` é verdadeiro.
 * KRs com status "Não iniciado" ficam de fora (e os épicos deles também).
 * Devolve `{ rows, range, months, todayFraction, undated }`: `undated` são os objetivos sem nenhuma data.
 */
export function buildOkrGantt({ objectives, keyResults, today = new Date(), epicsOfKr = null, showEpics = false }) {
  const day = startOfDay(today);
  const groups = objectives.map((objective) => {
    const krs = keyResults.filter((k) => k.objectiveId === objective.id && !NOT_STARTED.has(k.status)).map((kr) => {
      const s = krSpan(kr, objective);
      const h = krHealth(kr, { objective, now: day });
      const epics = showEpics && epicsOfKr ? epicsOfKr(kr).filter((e) => e.start && e.end) : [];
      return { kr, span: s, health: h, epics };
    });
    return { objective, krs, span: objectiveSpan(objective, krs.map((k) => k.span)) };
  });

  const rows = [];
  const undated = [];
  for (const g of groups) {
    if (!g.span) { undated.push(g.objective); continue; }
    rows.push({ type: "objective", id: g.objective.id, item: g.objective, span: g.span, health: objectiveHealth(g.krs.map((k) => k.health.health)) });
    for (const k of g.krs) {
      rows.push({ type: "kr", id: k.kr.id, item: k.kr, span: k.span, health: k.health.health, progress: k.health.progress, reason: k.health.reason });
      for (const e of k.epics) rows.push({ type: "epic", id: `${k.kr.id}:${e.key}`, item: e, span: span(e.start, e.end), health: e.health });
    }
  }
  const range = timeRange(rows.map((r) => r.span), day);
  return { rows, range, months: monthsBetween(range.start, addDays(range.end, -1)), todayFraction: fractionOf(day, range), undated };
}
