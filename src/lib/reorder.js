/**
 * Reordenar uma lista com setas "subir/descer": só lógica pura. A ordem de
 * Objetivos e de Key Results é a ordem em que ficam guardados no servidor; a
 * tela só diz "este item vai antes/depois daquele".
 */

/**
 * Para onde vai `id` ao subir ou descer entre os itens VISÍVEIS (`visibleIds`, na ordem da tela, já com o
 * filtro aplicado). Devolve `{ relativeTo, position }` ("before" | "after") ou `null` na ponta da lista.
 */
export function moveTarget(visibleIds, id, direction) {
  const at = visibleIds.indexOf(id);
  if (at === -1) return null;
  if (direction === "up") return at > 0 ? { relativeTo: visibleIds[at - 1], position: "before" } : null;
  if (direction === "down") return at < visibleIds.length - 1 ? { relativeTo: visibleIds[at + 1], position: "after" } : null;
  return null;
}

/** `list` na ordem de `order` (ids). O que não está em `order` fica no fim, na ordem em que estava. */
export function applyOrder(list, order) {
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...list].sort((a, b) => (rank.has(a.id) ? rank.get(a.id) : Infinity) - (rank.has(b.id) ? rank.get(b.id) : Infinity));
}
