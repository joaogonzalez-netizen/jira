/**
 * Regras da tela da Diretoria: saúde de Key Results, objetivos e projetos
 * (épicos), funil por etapa, linha do tempo por trimestre, entregas recentes e
 * o que está andando sem Key Result. Só lógica pura (sem React, sem rede) para
 * ser testada: a tela apenas desenha o que sai daqui.
 *
 * Saúde, do pior para o melhor: "late" (atrasado) > "risk" (em risco) >
 * "on_track" (no prazo); "done" (atingido/concluído) e "idle" (não avaliado:
 * planejado, pausado ou sem dado para medir) ficam de fora da comparação.
 */
import { norm } from "./status-order.js";
import { queueTargetOf } from "./status-queue.js";

const DAY = 86400000;
/** Quanto o KR pode ficar atrás do ritmo linear antes de virar "em risco" (15 pontos). */
export const PACE_TOLERANCE = 0.15;
/** Sem check-in há mais que isto (e KR em andamento) = em risco: já passaram duas semanas. */
export const STALE_CHECKIN_DAYS = 14;

export const isNum = (v) => typeof v === "number" && Number.isFinite(v);

/** % de 0 a 100 entre início e meta; `null` se faltar número ou se início = meta. */
export function krProgress(kr) {
  if (!isNum(kr.baseline) || !isNum(kr.target) || !isNum(kr.current) || kr.target === kr.baseline) return null;
  return Math.max(0, Math.min(100, Math.round(((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100)));
}

const isoToDate = (iso) => {
  const m = typeof iso === "string" && iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const fmtBR = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
/** "DD/MM/AAAA[ HH:MM:SS]" -> Date (meia-noite local) ou null. */
export function parseBR(str) {
  if (!str) return null;
  const [d, m, y] = String(str).trim().split(" ")[0].split("/");
  return d && m && y ? new Date(Number(y), Number(m) - 1, Number(d)) : null;
}
export function mondayOf(date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

/**
 * Saúde de um Key Result. O ritmo esperado é linear entre o início do objetivo
 * (ou, sem ele, o primeiro check-in) e o prazo do KR.
 * Devolve `{ health, progress, expected, reason }`; `expected` (0–1) é null sem ritmo.
 */
export function krHealth(kr, { objective = null, now = new Date() } = {}) {
  const today = startOfDay(now);
  const progress = krProgress(kr);
  if (kr.status === "Concluído" || (progress !== null && progress >= 100)) return { health: "done", progress, expected: null, reason: "Meta atingida" };
  if (kr.status !== "Em andamento") return { health: "idle", progress, expected: null, reason: kr.status || "Sem status" };

  const due = isoToDate(kr.dueDate);
  if (due && today > due) return { health: "late", progress, expected: 1, reason: `Prazo venceu em ${fmtBR(due)}` };

  const checkins = Array.isArray(kr.checkins) ? kr.checkins : [];
  const startFromCheckin = checkins.length ? isoToDate(checkins[0].week) : null;
  const start = isoToDate(objective && objective.startDate) || startFromCheckin;
  let expected = null;
  if (due && start && due > start) expected = Math.max(0, Math.min(1, (today - start) / (due - start)));

  if (progress !== null && expected !== null && progress / 100 < expected - PACE_TOLERANCE) {
    return { health: "risk", progress, expected, reason: `Abaixo do ritmo: ${progress}% feito, ${Math.round(expected * 100)}% do prazo já passou` };
  }
  const lastWeek = checkins.length ? isoToDate(checkins[checkins.length - 1].week) : null;
  if (lastWeek && (today - lastWeek) / DAY > STALE_CHECKIN_DAYS) {
    return { health: "risk", progress, expected, reason: `Sem check-in desde ${fmtBR(lastWeek)}` };
  }
  if (progress === null) return { health: "idle", progress, expected, reason: "Sem números para medir o progresso" };
  return { health: "on_track", progress, expected, reason: "No ritmo" };
}

const SEVERITY = { late: 3, risk: 2, on_track: 1 };
/** Pior saúde entre os Key Results avaliados; "done" se todos atingidos; "idle" se nada a avaliar. */
export function objectiveHealth(healths) {
  const rated = healths.filter((h) => SEVERITY[h]);
  if (rated.length) return rated.reduce((worst, h) => (SEVERITY[h] > SEVERITY[worst] ? h : worst));
  return healths.length && healths.every((h) => h === "done") ? "done" : "idle";
}

/** Data em que a barra termina no Gantt (último dia da semana final); `startWeek` é relativo à semana atual. */
export function scheduleEnd(pos, now = new Date()) {
  if (!pos || !pos.roadmapLane || !isNum(pos.startWeek)) return null;
  const weeks = (Number.isInteger(pos.durationWeeks) ? pos.durationWeeks : 2);
  return addDays(addDays(mondayOf(now), (pos.startWeek + weeks - 1) * 7), 6);
}

const isDone = (e) => e.status === "Done" || e.stage === "Concluído";
/** Quando o item foi entregue: a semana escolhida à mão, senão a data de conclusão do Jira. */
export function doneDate(item, pos) {
  const manual = (pos && pos.doneWeek) || item.doneWeek;
  return manual ? isoToDate(manual) : parseBR(item.dataConcl);
}

/** Saúde de um projeto (épico): concluído, atrasado (barra terminou e não concluiu), no prazo, ou sem data no Gantt. */
export function epicHealth(epic, pos, now = new Date()) {
  if (isDone(epic)) return "done";
  const end = scheduleEnd(pos, now);
  if (!end) return "unscheduled";
  return startOfDay(now) > end ? "late" : "on_track";
}

/* ------------------------------ funil por etapa ------------------------------ */

export const FUNNEL_STAGES = [
  ["backlog", "Backlog"],
  ["produto", "Produto"],
  ["ux", "UX/UI"],
  ["tech", "Análise técnica"],
  ["ready", "Pronto p/ dev"],
  ["dev", "Em dev"],
  ["rollout", "Em rollout"],
];
const READY = new Set(["Pronto P/ DEV", "Pronta pra dev", "Fila da Sprint"].map(norm));
const TECH = new Set(["Em refinamento Técnico", "Análise técnica", "Aguardado suporte"].map(norm));

/** Etapa de um projeto em aberto: a fila em que alguém o pôs à mão vale mais que o status. */
export function stageOf(card, { filaProdutoOrder = [], filaUxOrder = [] } = {}) {
  if (filaProdutoOrder.includes(card.key)) return "produto";
  if (filaUxOrder.includes(card.key)) return "ux";
  const target = queueTargetOf(card);
  if (target === "produto" || target === "ux") return target;
  const st = norm(card.status);
  if (st === norm("Em rollout")) return "rollout";
  if (READY.has(st)) return "ready";
  if (TECH.has(st)) return "tech";
  if (target === "dev") return "dev";
  return "backlog";
}

/** Contagem de projetos em aberto por etapa, na ordem do funil. */
export function funnel(cards, queues) {
  const buckets = Object.fromEntries(FUNNEL_STAGES.map(([key, label]) => [key, { key, label, count: 0, items: [] }]));
  for (const card of cards) {
    if (isDone(card)) continue;
    const b = buckets[stageOf(card, queues)];
    b.count += 1;
    b.items.push(card);
  }
  return FUNNEL_STAGES.map(([key]) => buckets[key]);
}

/** Projetos já andando (fora do Backlog) que ainda não estão ligados a nenhum Key Result. */
export function withoutKr(cards, queues, hasKr) {
  return cards.filter((c) => !isDone(c) && stageOf(c, queues) !== "backlog" && !hasKr(c));
}

/* ------------------------- trimestres e entregas -------------------------- */

export function quarterOf(date) {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return { key: `${date.getFullYear()}-Q${q}`, label: `Q${q}/${String(date.getFullYear()).slice(2)}` };
}

/** Quatro trimestres: o anterior, o atual e os dois seguintes. */
export function timelineQuarters(now = new Date()) {
  const current = quarterOf(now);
  const out = [];
  for (let offset = -1; offset <= 2; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset * 3, 1);
    const q = quarterOf(d);
    out.push({ ...q, isCurrent: q.key === current.key });
  }
  return out;
}

/**
 * O que entrega em cada trimestre, por produto: o que termina no Gantt (ou foi
 * entregue) dentro da janela. Projeto sem data no Gantt fica de fora.
 * `products` define a ordem das linhas; produto fora da lista entra no fim.
 */
export function quarterTimeline(cards, positions, { now = new Date(), products = [] } = {}) {
  const columns = timelineQuarters(now);
  const inWindow = new Set(columns.map((c) => c.key));
  const rowsByProduct = new Map();
  for (const card of cards) {
    if (!card.project) continue;
    const pos = positions[card.key];
    const when = isDone(card) ? doneDate(card, pos) : scheduleEnd(pos, now);
    if (!when) continue;
    const q = quarterOf(when).key;
    if (!inWindow.has(q)) continue;
    if (!rowsByProduct.has(card.project)) rowsByProduct.set(card.project, {});
    const cells = rowsByProduct.get(card.project);
    (cells[q] = cells[q] || []).push({ ...card, health: epicHealth(card, pos, now), when });
  }
  const order = [...products.filter((p) => rowsByProduct.has(p)), ...[...rowsByProduct.keys()].filter((p) => !products.includes(p)).sort()];
  return { columns, rows: order.map((product) => ({ product, cells: rowsByProduct.get(product) })) };
}

/** Projetos concluídos nas últimas `weeks` semanas, do mais recente para o mais antigo. */
export function recentDeliveries(cards, positions, { now = new Date(), weeks = 6, limit = 8 } = {}) {
  const since = addDays(startOfDay(now), -weeks * 7);
  return cards
    .filter((c) => isDone(c))
    .map((c) => ({ card: c, when: doneDate(c, positions[c.key]) }))
    .filter((x) => x.when && x.when >= since && x.when <= addDays(startOfDay(now), 7))
    .sort((a, b) => b.when - a.when)
    .slice(0, limit);
}
