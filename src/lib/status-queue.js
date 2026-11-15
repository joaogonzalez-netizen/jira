/**
 * Automação das filas pelo status e pelo projeto do Jira. Os dois mapas abaixo
 * são o único lugar a editar para mudar quem vai para onde:
 *   produto → Fila Produto · ux → Fila UX · dev → sai das filas (fica em
 *   Projetos, no board de Dev). Status fora do mapa não é tocado.
 *   productops → Fila ProductOps, pelo PROJETO do Jira (o workflow de épico é o
 *   mesmo em todos os projetos e não tem status de ProductOps): o card entra
 *   quando sai do Backlog e ainda não está em outra disciplina (Produto, UX) nem
 *   no Dev; Backlog fica em Projetos para ser priorizado à mão.
 * O Gantt fica de fora (a colocação dele tem automação própria).
 */
import { norm } from "./status-order.js";

export const QUEUE_STATUS_MAP = {
  produto: ["Produto", "Refinamento de negócio", "Em análise", "Handoff"],
  ux: ["Em design", "Design ready", "Fila da sprint UX", "[UX] Em andamento", "[UX] Priorizado"],
  dev: [
    "Fila da Sprint", "Em DEV", "Code Review",
    "Pronta p/ teste", "Pronto para testes", "Pronto para teste", "Pronta para teste",
    "Em testes", "Em teste", "Pronto P/ Deploy", "Pronto para deploy", "Em rollout",
  ],
};

const TARGET_OF = new Map();
for (const [target, statuses] of Object.entries(QUEUE_STATUS_MAP)) statuses.forEach((st) => TARGET_OF.set(norm(st), target));

/** Projeto do Jira (nome) -> fila que ele alimenta, quando o status não decide. */
export const QUEUE_PROJECT_MAP = { productops: ["ProductOps"] };

const PROJECT_QUEUE_OF = new Map();
for (const [queue, projects] of Object.entries(QUEUE_PROJECT_MAP)) projects.forEach((p) => PROJECT_QUEUE_OF.set(norm(p), queue));
// Em projeto de fila por projeto: ainda não priorizado (fica em Projetos)…
const NOT_YET = new Set(["backlog", "candidato proximo trimestre"].map(norm));
// …e já pronto para o Dev (sai da fila), além dos status "dev" do mapa.
const READY_FOR_DEV = new Set(["Pronto P/ DEV", "Pronta pra dev"].map(norm));

/** "produto", "ux", "productops", "dev" ou null (sem regra). */
export function queueTargetOf(item) {
  const byStatus = TARGET_OF.get(norm(item.status)) || null;
  const byProject = PROJECT_QUEUE_OF.get(norm(item.project));
  if (!byProject) return byStatus;
  if (byStatus === "dev" || READY_FOR_DEV.has(norm(item.status))) return "dev";
  if (byStatus) return byStatus; // Produto e UX são disciplinas com fila própria: o status explícito vence
  if (!item.status || NOT_YET.has(norm(item.status))) return null;
  return byProject;
}

// Onde o card tem de estar para valer o destino: "dev" é fora de todas as filas.
const PLACE_OF = { produto: "produto", ux: "ux", productops: "productops", dev: "none" };

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
export function planQueueAutomation({ cards, positions, filaProdutoOrder, filaUxOrder, filaOpsOrder = [] }) {
  const inProduto = new Set(filaProdutoOrder);
  const inUx = new Set(filaUxOrder);
  const inOps = new Set(filaOpsOrder);
  const placeNow = (key) => (inProduto.has(key) ? "produto" : inUx.has(key) ? "ux" : inOps.has(key) ? "productops" : "none");
  const seen = new Set();
  const changes = [];
  const marks = {};
  let produto = filaProdutoOrder;
  let ux = filaUxOrder;
  let ops = filaOpsOrder;

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
    ops = ops.filter((k) => k !== card.key);
    if (target === "produto") produto = [...produto, card.key];
    if (target === "ux") ux = [...ux, card.key];
    if (target === "productops") ops = [...ops, card.key];
    marks[card.key] = { ...(pos || { roadmapLane: null, startWeek: null, durationWeeks: 2 }), autoQueue: target };
    changes.push({ key: card.key, from: here, to: PLACE_OF[target] });
  }
  if (!changes.length) return null;
  return { positions: { ...positions, ...marks }, filaProdutoOrder: produto, filaUxOrder: ux, filaOpsOrder: ops, changes };
}
