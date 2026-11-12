/**
 * Automação das filas de Produto e UX pelo status do Jira. O mapa abaixo é o
 * único lugar a editar para mudar quem vai para onde:
 *   produto → Fila Produto · ux → Fila UX · dev → sai das filas (fica em
 *   Projetos, no board de Dev). Status fora do mapa não é tocado.
 * O Gantt fica de fora (a colocação dele tem automação própria).
 */
import { norm } from "./status-order.js";

export const QUEUE_STATUS_MAP = {
  produto: ["Produto", "Refinamento de negócio", "Em análise", "Handoff"],
  ux: ["Em design", "Design ready", "Fila da sprint UX"],
  dev: [
    "Fila da Sprint", "Em DEV", "Code Review",
    "Pronta p/ teste", "Pronto para testes", "Pronto para teste", "Pronta para teste",
    "Em testes", "Em teste", "Pronto P/ Deploy", "Pronto para deploy", "Em rollout",
  ],
};

const TARGET_OF = new Map();
for (const [target, statuses] of Object.entries(QUEUE_STATUS_MAP)) statuses.forEach((st) => TARGET_OF.set(norm(st), target));

/** "produto", "ux", "dev" ou null (status sem regra). */
export const queueTargetOf = (item) => TARGET_OF.get(norm(item.status)) || null;

// Onde o card tem de estar para valer o destino: "dev" é fora das duas filas.
const PLACE_OF = { produto: "produto", ux: "ux", dev: "none" };

/**
 * Decide o que a automação muda, sem tocar em nada. Cada card concluído, sem
 * produto, com a barra no Gantt ou sem regra de status é ignorado. A marca
 * `autoQueue` (guardada na posição do card) diz o que a automação aplicou da
 * última vez; é ela que separa o que é automático do que alguém moveu à mão:
 *  - tem marca e o card não está onde a marca diz → foi movido à mão: não mexe;
 *  - sem marca e já está numa fila → foi posto à mão: não mexe;
 *  - fora disso, aplica o destino do status e grava a marca.
 * Devolve null se não há o que mudar.
 */
export function planQueueAutomation({ cards, positions, filaProdutoOrder, filaUxOrder }) {
  const inProduto = new Set(filaProdutoOrder);
  const inUx = new Set(filaUxOrder);
  const placeNow = (key) => (inProduto.has(key) ? "produto" : inUx.has(key) ? "ux" : "none");
  const seen = new Set();
  const changes = [];
  const marks = {};
  let produto = filaProdutoOrder;
  let ux = filaUxOrder;

  for (const card of cards) {
    if (seen.has(card.key)) continue;
    seen.add(card.key);
    if (!card.project || card.status === "Done" || card.stage === "Concluído") continue;
    const pos = positions[card.key];
    if (pos && pos.roadmapLane) continue; // Gantt: fora da automação
    const target = queueTargetOf(card);
    if (!target) continue;
    const here = placeNow(card.key);
    const mark = pos && pos.autoQueue;
    if (mark ? here !== PLACE_OF[mark] || mark === target : here !== "none") continue;
    if (!mark && target === "dev") continue; // já está fora das filas: nada a fazer nem a marcar

    produto = produto.filter((k) => k !== card.key);
    ux = ux.filter((k) => k !== card.key);
    if (target === "produto") produto = [...produto, card.key];
    if (target === "ux") ux = [...ux, card.key];
    marks[card.key] = { ...(pos || { roadmapLane: null, startWeek: null, durationWeeks: 2 }), autoQueue: target };
    changes.push({ key: card.key, from: here, to: PLACE_OF[target] });
  }
  if (!changes.length) return null;
  return { positions: { ...positions, ...marks }, filaProdutoOrder: produto, filaUxOrder: ux, changes };
}
