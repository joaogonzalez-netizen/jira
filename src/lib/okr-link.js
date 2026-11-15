/**
 * Vínculo entre o Roadmap e os OKRs: a que Key Result (e Objetivo) cada card
 * pertence, para filtrar e agrupar o Gantt e as filas. Só lógica pura — quem
 * guarda o vínculo é o próprio KR (`keyResult.epicKeys`), e o Roadmap só lê.
 *
 * Um épico pertence a no máximo um KR (a tela de KR garante isso). Uma tarefa,
 * história ou bug herda o KR do épico pai.
 */

/** Chave da raia / opção "sem vínculo". */
export const NO_LINK = "__sem_vinculo__";

/**
 * `{ kr, objective }` do card, ou `null` se ele não está ligado a nenhum KR.
 * `objective` é `null` quando o KR aponta para um objetivo que não existe mais.
 */
export function okrOf(item, { krByEpic, objectiveById }) {
  if (!item) return null;
  const kr = krByEpic[item.key] || (item.parent ? krByEpic[item.parent] : null) || null;
  if (!kr) return null;
  return { kr, objective: objectiveById[kr.objectiveId] || null };
}

/** Filtro do Roadmap: "all" | "none" | "obj:<id>" | "kr:<id>". Valor desconhecido não esconde nada. */
export function matchesOkrFilter(link, filter) {
  if (!filter || filter === "all") return true;
  if (filter === "none") return !link;
  if (!link) return false;
  if (filter.startsWith("kr:")) return link.kr.id === filter.slice(3);
  if (filter.startsWith("obj:")) return !!link.objective && link.objective.id === filter.slice(4);
  return true;
}

/**
 * Raias da visão por OKR: uma por KR (agrupadas na ordem dos objetivos), só as
 * que têm card agendado, e "Sem vínculo" por último — sempre presente, para o
 * que ainda não tem KR ficar à vista. Cada raia: `{ key, label, caption, items }`.
 */
export function buildOkrLanes(items, { objectives, keyResults, krByEpic, objectiveById }) {
  const byKr = new Map();
  const loose = [];
  for (const item of items) {
    const link = okrOf(item, { krByEpic, objectiveById });
    if (!link) { loose.push(item); continue; }
    if (!byKr.has(link.kr.id)) byKr.set(link.kr.id, []);
    byKr.get(link.kr.id).push(item);
  }
  const lanes = [];
  const seen = new Set();
  const push = (kr, objective) => {
    if (seen.has(kr.id) || !byKr.has(kr.id)) return;
    seen.add(kr.id);
    lanes.push({ key: `kr:${kr.id}`, label: kr.name || "Key Result sem nome", caption: objective ? objective.name : "", items: byKr.get(kr.id) });
  };
  for (const o of objectives) for (const kr of keyResults) if (kr.objectiveId === o.id) push(kr, o);
  for (const kr of keyResults) push(kr, objectiveById[kr.objectiveId] || null); // KR de objetivo que sumiu
  lanes.push({ key: NO_LINK, label: "Sem vínculo", caption: "", items: loose });
  return lanes;
}

/** Quantos dos cards estão ligados a um KR — o número que mostra o buraco. */
export function okrCoverage(items, ctx) {
  let linked = 0;
  for (const item of items) if (okrOf(item, ctx)) linked += 1;
  return { linked, total: items.length };
}
