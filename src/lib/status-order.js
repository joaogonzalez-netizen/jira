/**
 * Ordem dos status do Jira "de trás pra frente": o que está mais perto de
 * entregue vem primeiro (Concluído, Pronto P/ Deploy, Em testes…) até o
 * Backlog. Cada linha é um degrau; as grafias da mesma linha valem o mesmo
 * (a planilha diz "Aguardado suporte", o quadro do Jira diz "Aguardando
 * suporte"). Acento, caixa e pontuação não contam.
 */
export const STATUS_BACK_TO_FRONT = [
  ["Concluído", "Done"],
  ["Em rollout"],
  ["Pronto P/ Deploy", "Pronto para deploy"],
  ["Em testes", "Em teste"],
  ["Pronta p/ teste", "Pronto para testes", "Pronto para teste", "Pronta para teste"],
  ["Code Review"],
  ["Em DEV"],
  ["Fila da Sprint"],
  ["Fila da sprint UX"],
  ["Pronto P/ DEV", "Pronto para dev"],
  ["Em refinamento Técnico", "Refinamento técnico"],
  ["Aguardado suporte", "Aguardando suporte"],
  ["Handoff"],
  ["Em análise"],
  ["Refinamento de negócio"],
  ["Produto"],
  ["Design ready"],
  ["Em design"],
  ["Candidato Próximo Trimestre"],
  ["Backlog"],
];

const norm = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const RANK_OF = new Map();
STATUS_BACK_TO_FRONT.forEach((names, rank) => names.forEach((n) => RANK_OF.set(norm(n), rank)));

// Status que a lista não conhece entra pela etapa em que o card está.
const STAGE_RANK = {
  "Concluído": "Done", "Em rollout": "Em rollout", "Em dev": "Em DEV", "Pronta pra dev": "Pronto P/ DEV",
  "Análise técnica": "Em refinamento Técnico", "Em produto": "Em análise", "Em design": "Em design", "Backlog": "Backlog",
};

/** Posição do card na ordem (0 = mais avançado). Sem status nem etapa reconhecidos, vai para o fim. */
export function statusRank(item) {
  const byStatus = RANK_OF.get(norm(item.status));
  if (byStatus !== undefined) return byStatus;
  const stage = STAGE_RANK[item.stage];
  return stage ? RANK_OF.get(norm(stage)) : STATUS_BACK_TO_FRONT.length;
}

const doneTime = (item) => {
  const [d, m, y] = String(item.dataConcl || "").trim().split(" ")[0].split("/");
  const t = d && m && y ? new Date(`${y}-${m}-${d}T00:00:00`).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
};

/** Mais avançado primeiro; no mesmo status, a conclusão mais recente, depois a chave. */
export function byStatusBackToFront(a, b) {
  return statusRank(a) - statusRank(b)
    || doneTime(b) - doneTime(a)
    || String(a.key).localeCompare(String(b.key), undefined, { numeric: true });
}
