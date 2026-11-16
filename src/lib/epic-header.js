/**
 * Monta, a partir dos dados do planejamento, o cabeçalho de contexto que vai
 * para o topo da descrição do épico no Jira (o servidor valida e converte em
 * ADF: `src/server/epic-header.js`). Só lógica pura: nada de rede nem de React.
 */

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

/** "2026-01-15" -> "15/01/2026"; qualquer outra coisa -> "". */
export function fmtIsoBR(iso) {
  const m = typeof iso === "string" && iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

const shortBR = (iso) => {
  const full = fmtIsoBR(iso);
  return full ? `${full.slice(0, 6)}${full.slice(8)}` : "";
};

/** "20/01/26 → 15/01/27" (ou só uma das pontas); vazio se o objetivo não tem datas. */
export function periodOf(objective) {
  if (!objective || (!objective.startDate && !objective.endDate)) return "";
  return `${shortBR(objective.startDate) || "…"} → ${shortBR(objective.endDate) || "…"}`;
}

const num = (v) => String(v).replace(".", ",");

/** "81 R$ mi / 100 R$ mi" (atual / meta); "" sem os dois números. */
export function metricOf(kr) {
  if (!kr || !isNum(kr.current) || !isNum(kr.target)) return "";
  const unit = kr.unit ? (kr.unit === "%" ? "%" : ` ${kr.unit}`) : "";
  return `${num(kr.current)}${unit} / ${num(kr.target)}${unit}`;
}

/**
 * `objective`, `keyResult`, `opportunity`, `solution` e `experiments` são os itens do planejamento
 * (qualquer um pode faltar); `appUrl` é o endereço do app, para o link de volta.
 */
export function buildEpicHeader({ objective = null, keyResult = null, opportunity = null, solution = null, experiments = [], appUrl = null }) {
  return {
    objective: objective ? { name: objective.name, period: periodOf(objective) } : null,
    keyResult: keyResult ? { name: keyResult.name, metric: metricOf(keyResult), due: fmtIsoBR(keyResult.dueDate) } : null,
    opportunity: opportunity ? { name: opportunity.name, description: opportunity.description || "", links: (opportunity.links || []).map((l) => ({ label: l.label, url: l.url })) } : null,
    solution: solution ? { name: solution.name, description: solution.description || "" } : null,
    experiments: experiments.map((x) => ({ name: x.name, hypothesis: x.hypothesis || "", status: x.status || "", outcome: x.outcome || "" })),
    appUrl,
  };
}
