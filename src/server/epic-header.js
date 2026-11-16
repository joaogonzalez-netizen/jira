/**
 * Cabeçalho "Contexto" do épico no Jira: um bloco no topo da descrição com o
 * Objetivo e o Key Result, a oportunidade (dor, evidência, links), a solução e
 * os experimentos. Fica entre um título fixo e uma linha horizontal, para dar
 * para reescrevê-lo depois sem tocar no resto da descrição.
 *
 * O cliente manda dados estruturados, nunca ADF pronto: aqui eles são validados
 * (tamanho, só links http/https) e só então viram o documento do Jira.
 */

export const HEADER_TITLE = "Contexto — STL Roadmap";

const LIMITS = { name: 200, text: 2000, short: 500, label: 80, url: 500, links: 10, experiments: 10 };

const str = (v, max) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max) : "");
const isHttpUrl = (v) => typeof v === "string" && v.length <= LIMITS.url && /^https?:\/\/[^\s]+$/i.test(v);

/**
 * Valida o cabeçalho. `{ ok: true, header }` com tudo aparado, ou `{ ok: false, message }`.
 * Sem nada para mostrar (tudo vazio) também é recusado: não se escreve um bloco vazio no Jira.
 */
export function cleanHeader(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, message: "Cabeçalho inválido" };
  const named = (o, extra = {}) => {
    if (!o || typeof o !== "object") return null;
    const name = str(o.name, LIMITS.name);
    return name ? { name, ...Object.fromEntries(Object.entries(extra).map(([k, max]) => [k, str(o[k], max)])) } : null;
  };
  const objective = named(input.objective, { period: LIMITS.label });
  const keyResult = named(input.keyResult, { metric: LIMITS.short, due: LIMITS.label });
  const opportunity = named(input.opportunity, { description: LIMITS.text });
  const solution = named(input.solution, { description: LIMITS.text });
  if (opportunity) {
    const links = Array.isArray(input.opportunity.links) ? input.opportunity.links : [];
    opportunity.links = links
      .filter((l) => l && isHttpUrl(l.url))
      .slice(0, LIMITS.links)
      .map((l) => ({ label: str(l.label, LIMITS.label) || l.url, url: l.url }));
  }
  const experiments = (Array.isArray(input.experiments) ? input.experiments : [])
    .map((x) => named(x, { hypothesis: LIMITS.short, status: LIMITS.label, outcome: LIMITS.label }))
    .filter(Boolean)
    .slice(0, LIMITS.experiments);
  const appUrl = isHttpUrl(input.appUrl) ? input.appUrl : null;
  if (!objective && !keyResult && !opportunity && !solution && !experiments.length) return { ok: false, message: "O cabeçalho está vazio" };
  return { ok: true, header: { objective, keyResult, opportunity, solution, experiments, appUrl } };
}

/* ----------------------------- montagem do ADF ----------------------------- */

const text = (t, marks) => ({ type: "text", text: t, ...(marks ? { marks } : {}) });
const strong = (t) => text(t, [{ type: "strong" }]);
const link = (label, url) => text(label, [{ type: "link", attrs: { href: url } }]);
const paragraph = (...nodes) => ({ type: "paragraph", content: nodes });

/** Texto com quebras de linha viram parágrafos; linha simples vira quebra dentro do parágrafo. */
function textParagraphs(value) {
  return value.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean).map((block) => {
    const nodes = [];
    block.split("\n").forEach((line, i) => {
      if (i > 0) nodes.push({ type: "hardBreak" });
      if (line) nodes.push(text(line));
    });
    return paragraph(...nodes);
  });
}

const labeled = (label, value) => paragraph(strong(`${label}: `), text(value));

/** Os nós ADF do cabeçalho, do título à linha horizontal que o fecha. */
export function headerNodes(header) {
  const nodes = [{ type: "heading", attrs: { level: 3 }, content: [text(HEADER_TITLE)] }];
  const { objective, keyResult, opportunity, solution, experiments, appUrl } = header;
  if (objective) nodes.push(labeled("Objetivo", objective.period ? `${objective.name} (${objective.period})` : objective.name));
  if (keyResult) {
    const extra = [keyResult.metric, keyResult.due ? `prazo ${keyResult.due}` : ""].filter(Boolean).join(" · ");
    nodes.push(labeled("Key Result", extra ? `${keyResult.name} — ${extra}` : keyResult.name));
  }
  if (opportunity) {
    nodes.push(labeled("Oportunidade", opportunity.name));
    if (opportunity.description) nodes.push(...textParagraphs(opportunity.description));
    if (opportunity.links.length) {
      const parts = [strong("Links: ")];
      opportunity.links.forEach((l, i) => { if (i) parts.push(text(" · ")); parts.push(link(l.label, l.url)); });
      nodes.push(paragraph(...parts));
    }
  }
  if (solution) {
    nodes.push(labeled("Solução", solution.name));
    if (solution.description) nodes.push(...textParagraphs(solution.description));
  }
  if (experiments.length) {
    nodes.push(paragraph(strong("Experimentos:")));
    nodes.push({
      type: "bulletList",
      content: experiments.map((x) => {
        const meta = [x.status, x.outcome].filter(Boolean).join(" · ");
        const line = [x.name, x.hypothesis ? `— ${x.hypothesis}` : "", meta ? `(${meta})` : ""].filter(Boolean).join(" ");
        return { type: "listItem", content: [paragraph(text(line))] };
      }),
    });
  }
  if (appUrl) nodes.push(paragraph(link("Abrir no STL Roadmap", appUrl)));
  nodes.push({ type: "rule" });
  return nodes;
}

const isHeaderStart = (node) => node && node.type === "heading" && node.content && node.content[0] && node.content[0].text === HEADER_TITLE;

/**
 * Descrição `doc` (ADF, ou null) com o cabeçalho trocado: o bloco antigo — do título até a primeira linha
 * horizontal depois dele — sai e o novo entra no topo; sem bloco antigo, o novo também vai para o topo. Se o bloco
 * antigo perdeu a linha que o fecha, o novo vai para o topo e nada do resto é apagado.
 */
export function withHeader(doc, nodes) {
  const body = doc && doc.type === "doc" && Array.isArray(doc.content) ? doc.content : [];
  const start = body.findIndex(isHeaderStart);
  let rest = body;
  if (start !== -1) {
    const end = body.findIndex((n, i) => i > start && n && n.type === "rule");
    if (end !== -1) rest = [...body.slice(0, start), ...body.slice(end + 1)];
  }
  return { type: "doc", version: 1, content: [...nodes, ...rest] };
}
