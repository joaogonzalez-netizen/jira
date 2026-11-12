/**
 * Prioridade manual dos cards da tela Entregas. A lista de chaves de um produto
 * (`cardKeys`) manda: quem está nela vem primeiro, na ordem dela; o resto cai
 * para a ordem de status (`fallback`). Sem lista, vale só o status.
 */
export function comparePriority(cardKeys, fallback) {
  const at = new Map(cardKeys.map((k, i) => [k, i]));
  return (a, b) => {
    const ia = at.get(a.key);
    const ib = at.get(b.key);
    if (ia !== undefined && ib !== undefined) return ia - ib;
    if (ia !== undefined) return -1;
    if (ib !== undefined) return 1;
    return fallback(a, b);
  };
}

/** Tira `dragged` de `order` e o põe antes ou depois de `target`. Chave que não está na lista não muda nada. */
export function reorderKeys(order, dragged, target, position) {
  if (dragged === target || !order.includes(dragged) || !order.includes(target)) return order;
  const rest = order.filter((k) => k !== dragged);
  const at = rest.indexOf(target) + (position === "after" ? 1 : 0);
  return [...rest.slice(0, at), dragged, ...rest.slice(at)];
}

/** Nova lista a gravar: a ordem visível primeiro, e o que já estava salvo e hoje não aparece vai atrás (não perde a prioridade). */
export function mergePriority(visibleOrder, saved, max = 3000) {
  const seen = new Set(visibleOrder);
  return [...visibleOrder, ...saved.filter((k) => !seen.has(k))].slice(0, max);
}
