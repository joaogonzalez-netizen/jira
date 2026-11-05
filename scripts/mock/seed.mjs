// Example data for local mock mode: OKRs, opportunity tree, experiments and
// features across the products, linked to epic keys from the embedded seed.
// Dates are relative to today so check-ins and deadlines stay current. The
// epics and issues are the app's embedded sheet seed, with dates moved forward
// so the newest issue is from today (Análises filters by recent periods).
import fs from "node:fs";

const DAY = 24 * 60 * 60 * 1000;
const iso = (d) => d.toISOString().slice(0, 10);

const BR_DATE = /^(\d{2})\/(\d{2})\/(\d{4})(.*)$/;
const pad = (n) => String(n).padStart(2, "0");
const parseBR = (v) => {
  const m = typeof v === "string" && v.match(BR_DATE);
  return m ? new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00`) : null;
};
const shiftBR = (v, ms) => {
  const m = typeof v === "string" && v.match(BR_DATE);
  if (!m) return v;
  const d = new Date(parseBR(v).getTime() + ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}${m[4]}`;
};

/** Embedded EPICS/TASKS seed from App.jsx, as a sheet snapshot dated to today. */
function sheetSnapshot(today) {
  const src = fs.readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8");
  const read = (name) => JSON.parse(src.split("\n").find((l) => l.startsWith(`const ${name} = `)).slice(`const ${name} = `.length).replace(/;\s*$/, ""));
  const epics = read("EPICS_SEED_INITIAL");
  const tasks = read("TASKS_SEED_INITIAL");
  const newest = Math.max(...tasks.map((t) => parseBR(t.created)?.getTime() || 0));
  const delta = today.getTime() - newest;
  const shift = (r) => ({ ...r, created: shiftBR(r.created, delta), dataInicio: shiftBR(r.dataInicio, delta), dataConcl: shiftBR(r.dataConcl, delta) });
  return { epics: epics.map(shift), tasks: tasks.map(shift), syncedAt: today.toISOString() };
}

export function buildSeed(today = new Date()) {
  const day = (offset) => iso(new Date(today.getTime() + offset * DAY));
  const monday = new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY);
  // Check-ins of the previous weeks; the current week stays pending on purpose.
  const ck = (vals) => vals.map((value, i) => ({ week: iso(new Date(monday.getTime() - (vals.length - i) * 7 * DAY)), value, note: "" }));
  const L = (label) => ({ label, url: `https://example.com/${label.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")}` });
  const qStart = day(-30);
  const qEnd = day(60);

  const objectives = [
    { id: "obj_emp", name: "Faturar R$ 100 mi no ano", product: "Empresa", goal: "Receita anual de R$ 100 mi", startDate: day(-300), endDate: qEnd, status: "Em andamento" },
    { id: "obj_flix", name: "Reduzir cancelamento da STLFLIX", product: "STLFLIX", goal: "Churn mensal abaixo de 4%", startDate: qStart, endDate: qEnd, status: "Em andamento" },
    { id: "obj_acad", name: "Aumentar conversão da STLACADEMY", product: "STL Academy", goal: "Conversão do checkout de 2% para 4%", startDate: qStart, endDate: qEnd, status: "Em andamento" },
    { id: "obj_seller", name: "Ativar vendedores no STLSeller", product: "STL Seller", goal: "40% dos novos vendedores publicam o 1º anúncio na 1ª semana", startDate: qStart, endDate: qEnd, status: "Em andamento" },
    { id: "obj_ia", name: "Fazer a STL IA virar hábito", product: "STL IA", goal: "Usuário semanal recorrente", startDate: qStart, endDate: qEnd, status: "Em andamento" },
  ];

  const K = (k) => ({ links: [], description: "", owner: "", quarter: "", epicKeys: [], dueDate: qEnd, status: "Em andamento", ...k });
  const keyResults = [
    K({ id: "kr_rev", objectiveId: "obj_emp", name: "Receita acumulada de R$ 72 mi para R$ 100 mi", product: "Empresa", owner: "João Gonzalez", baseline: 72, target: 100, current: 81, unit: "R$ mi", checkins: ck([76, 78, 80, 81]) }),
    K({ id: "kr_churn", objectiveId: "obj_flix", name: "Churn mensal de 6% para 4%", product: "STLFLIX", owner: "João Gonzalez", baseline: 6, target: 4, current: 5.2, unit: "%", epicKeys: ["FLIX-283", "FLIX-168"], checkins: ck([5.8, 5.6, 5.4, 5.2]) }),
    K({ id: "kr_eng", objectiveId: "obj_flix", name: "Downloads por assinante de 8 para 12/mês", product: "STLFLIX", baseline: 8, target: 12, current: 9.1, unit: "downloads", epicKeys: ["FLIX-305"], checkins: ck([8.4, 8.8, 9.1]) }),
    K({ id: "kr_conv", objectiveId: "obj_acad", name: "Conversão do checkout de 2% para 4%", product: "STL Academy", baseline: 2, target: 4, current: 2.6, unit: "%", epicKeys: ["ACADEMY-45"], checkins: ck([2.2, 2.4, 2.6]) }),
    K({ id: "kr_ret", objectiveId: "obj_acad", name: "Retenção M1 de 40% para 55%", product: "STL Academy", baseline: 40, target: 55, current: 44, unit: "%", checkins: ck([41, 43, 44]) }),
    K({ id: "kr_act", objectiveId: "obj_seller", name: "Ativação na 1ª semana de 22% para 40%", product: "STL Seller", owner: "João Gonzalez", baseline: 22, target: 40, current: 27, unit: "%", epicKeys: ["SELLER-255", "SELLER-256", "SELLER-200"], checkins: ck([23, 25, 27]) }),
    K({ id: "kr_wau", objectiveId: "obj_ia", name: "Usuários semanais recorrentes de 3 mil para 6 mil", product: "STL IA", baseline: 3000, target: 6000, current: 3900, unit: "usuários", epicKeys: ["IA-264", "IA-129", "IA-144"], checkins: ck([3300, 3600, 3900]) }),
  ];

  const O = (id, keyResultId, track, name, status, description = "", links = [], parentId = "") => ({ id, keyResultId, track, name, status, description, links, parentId });
  const opportunities = [
    O("opp_a1", "kr_conv", "UX", "Aluno quer saber exatamente o que está pagando antes do checkout", "Explorando", "Concorrentes deixam o teste pouco claro; o aluno descobre a cobrança depois.", [L("Board concorrentes"), L("Tela 3-4")]),
    O("opp_a2", "kr_ret", "UX", "Aluno quer estudar no celular e sem internet", "Aberta", "Concorrentes permitem baixar aulas no app.", [L("Achados App Store")]),
    O("opp_a3", "kr_conv", "UX", "Aluno quer achar logo os cursos do seu interesse", "Validada", "Home personalizada a partir do onboarding.", [L("Board Hi3D")]),
    O("opp_a3b", "kr_conv", "UX", "Recomendação por objetivo no onboarding", "Aberta", "", [], "opp_a3"),
    O("opp_a4", "kr_ret", "Conteúdos", "Aluno quer aprender em vídeos curtos, no formato de reels", "Explorando", "Alunos pediram vídeos curtos na pesquisa da STLACADEMY.", [L("Pesquisa de alunos")]),
    O("opp_a5", "kr_ret", "Conteúdos", "Aluno quer ir além do básico", "Aberta", "Reclamações de cursos rasos e falta de curadoria.", [L("Reddit"), L("Catálogo concorrente")]),
    O("opp_a6", "kr_ret", "Conteúdos", "Aluno quer praticar e mostrar seus projetos", "Aberta", "Comunidade de projetos é ponto forte dos concorrentes."),
    O("opp_a7", "kr_conv", "Negócios", "Aluno quer pagar pouco para experimentar, sem cobranças surpresa", "Aberta", "Reclamações de cobranças não percebidas, muitas em dólar.", [L("Reclame Aqui")]),
    O("opp_a8", "kr_conv", "Negócios", "Aluno quer certificado sem pagar à parte", "Aberta", "Concorrentes cobram o certificado separado."),
    O("opp_a9", "kr_conv", "Negócios", "Aluno quer segurança para comprar", "Validada", "Garantia de 30 dias logo no checkout aumenta a confiança."),
    O("opp_f1", "kr_churn", "UX", "Assinante não encontra STLs novos toda semana", "Explorando", "Queda de uso após a 3ª semana de assinatura.", [L("Dashboard retenção")]),
    O("opp_f2", "kr_churn", "Negócios", "Assinante cancela porque o preço pesa no fim do mês", "Aberta", "Motivo nº 1 na pesquisa de cancelamento.", [L("Pesquisa de churn")]),
    O("opp_f3", "kr_eng", "Conteúdos", "Assinante quer coleções temáticas prontas para imprimir", "Aberta", "Pedidos frequentes no Discord."),
    O("opp_f4", "kr_eng", "UX", "Assinante quer filtrar por impressora e material", "Validada", "Filtros novos já aumentaram downloads no Explore."),
    O("opp_s1", "kr_act", "UX", "Vendedor quer publicar o 1º anúncio em minutos", "Explorando", "Onboarding atual tem 9 passos.", [L("Gravações Hotjar")]),
    O("opp_s2", "kr_act", "Negócios", "Vendedor quer saber se vai ter lucro antes de anunciar", "Validada", "Calculadora é a ferramenta mais usada no trial."),
    O("opp_s3", "kr_act", "Conteúdos", "Vendedor quer textos de anúncio prontos para a Shopee", "Aberta", "Gerador de anúncios pedido por 60% dos entrevistados.", [L("Entrevistas com vendedores")]),
    O("opp_i1", "kr_wau", "UX", "Usuário quer achar o modelo certo sem saber o nome", "Explorando", "Buscas sem resultado em 18% das sessões."),
    O("opp_i2", "kr_wau", "Conteúdos", "Usuário quer modelos coloridos para multicolor", "Aberta", "Crescimento de impressoras multicolor."),
  ];

  const solutions = [
    { id: "sol_a1", opportunityId: "opp_a1", name: "Resumo do plano antes do pagamento", status: "Priorizada", description: "" },
    { id: "sol_a4", opportunityId: "opp_a4", name: "Trilha de aulas de 90s", status: "Ideia", description: "" },
    { id: "sol_f1", opportunityId: "opp_f1", name: "E-mail semanal com novidades por interesse", status: "Em teste", description: "" },
    { id: "sol_s1", opportunityId: "opp_s1", name: "Onboarding em 3 passos com anúncio pré-preenchido", status: "Em teste", description: "" },
    { id: "sol_s2", opportunityId: "opp_s2", name: "Calculadora dentro do cadastro de produto", status: "Validada", description: "" },
    { id: "sol_i1", opportunityId: "opp_i1", name: "Busca por imagem", status: "Ideia", description: "" },
  ];

  const X = (id, opportunityId, solutionId, name, status, extra = {}) => ({ id, opportunityId, solutionId, name, status, outcome: "", hypothesis: "", metric: "", unit: "", ...extra });
  const experiments = [
    X("exp_a1", "opp_a1", "sol_a1", "A/B do resumo no checkout", "Rodando", { metric: "conversão checkout", unit: "%", baseline: 2, target: 3, startDate: day(-14), dueDate: day(14), impact: 8, confidence: 6, ease: 7, hypothesis: "Se mostrarmos o resumo do plano antes do pagamento, a conversão sobe 1 p.p." }),
    X("exp_a2", "opp_a2", "", "Fake door: baixar aula", "Ideia", { impact: 5, confidence: 4, ease: 9 }),
    X("exp_a3", "opp_a7", "", "Plano de entrada a R$ 9,90", "Analisando", { metric: "trials pagos", unit: "%", baseline: 1.5, target: 2.5, result: 2.1, startDate: day(-35), dueDate: day(-3), impact: 7, confidence: 5, ease: 6 }),
    X("exp_f1", "opp_f1", "sol_f1", "E-mail semanal personalizado", "Rodando", { metric: "churn da coorte", unit: "%", baseline: 6, target: 5, startDate: day(-21), dueDate: day(4), impact: 7, confidence: 7, ease: 8 }),
    X("exp_f2", "opp_f2", "", "Pausar assinatura em vez de cancelar", "Concluído", { outcome: "Validado", metric: "cancelamentos evitados", unit: "%", baseline: 0, target: 10, result: 14, startDate: day(-60), dueDate: day(-30), impact: 9, confidence: 8, ease: 6 }),
    X("exp_s1", "opp_s1", "sol_s1", "Onboarding curto para 50% dos novos", "Rodando", { metric: "ativação 1ª semana", unit: "%", baseline: 22, target: 30, startDate: day(-7), dueDate: day(21), impact: 9, confidence: 7, ease: 5, epicKey: "SELLER-200" }),
    X("exp_s2", "opp_s3", "", "Gerador de anúncios em beta fechado", "Ideia", { impact: 8, confidence: 5, ease: 4, epicKey: "SELLER-255" }),
    X("exp_i1", "opp_i1", "sol_i1", "Protótipo de busca por imagem com 20 usuários", "Analisando", { startDate: day(-28), dueDate: day(2), impact: 6, confidence: 4, ease: 3 }),
  ];

  const features = [
    { id: "feat_f1", name: "Explore e filtros", product: "STLFLIX", status: "Ativa", description: "", epicKeys: ["FLIX-168"] },
    { id: "feat_f2", name: "Internacionalização", product: "STLFLIX", status: "Em construção", description: "", epicKeys: ["FLIX-283", "FLIX-257"] },
    { id: "feat_s1", name: "Calculadora de preços", product: "STL Seller", status: "Ativa", description: "", epicKeys: ["SELLER-256", "SELLER-249", "SELLER-248"] },
    { id: "feat_s2", name: "Gerador de anúncios", product: "STL Seller", status: "Em construção", description: "", epicKeys: ["SELLER-255"] },
    { id: "feat_i1", name: "Busca", product: "STL IA", status: "Em construção", description: "", epicKeys: ["IA-264"] },
    { id: "feat_b1", name: "Onboarding GetDemo", product: "Backoffice", status: "Em construção", description: "", epicKeys: ["BACK-46", "BACK-50"] },
  ];

  const now = today.toISOString();
  const stamp = (list) => list.map((x) => ({ createdAt: now, updatedAt: now, createdBy: "mock@local.test", ...x }));
  const snapshot = sheetSnapshot(today);
  return {
    // Roadmap already on the server, as in production (no migration banner).
    "jira:roadmap": { v: 1, rev: 1, updatedAt: now, updatedBy: "mock@local.test", positions: {}, customEpics: [], epicOverrides: {}, prioOrder: [], filaProdutoOrder: [], filaUxOrder: [] },
    "jira:sheet-snapshot": snapshot,
    "jira:sheet-snapshot-at": snapshot.syncedAt,
    "jira:migrations:initiatives-to-features": "done",
    "jira:migrations:initiatives-to-krs": "done",
    "jira:initiatives": [],
    "jira:objectives": stamp(objectives),
    "jira:key-results": stamp(keyResults),
    "jira:opportunities": stamp(opportunities),
    "jira:solutions": stamp(solutions),
    "jira:experiments": stamp(experiments),
    "jira:features": stamp(features),
  };
}

// Projects that only the new workspaces pull (Custom, ProductOps), to exercise
// the per-workspace Jira project filter in mock mode.
const EXTRA_PROJECTS = [
  { project: "Custom", prefix: "CUS", epics: ["Pedidos de impressão sob medida", "Orçamento automático de peças", "Portal do cliente Custom"] },
  { project: "Automação", prefix: "AUT", epics: ["STLResearch PT", "Bot de triagem do Intercom", "Publicação automática de drops"] },
  { project: "Dados", prefix: "DAD", epics: ["Data warehouse de assinaturas", "Dashboard de churn por coorte"] },
];
const PEOPLE = ["Ray Lima", "Jonas Tolentino", "Michel Angelo", "Caroline Araújo da Silva"];
const STATUSES = ["Backlog", "Em design", "Em DEV", "Em rollout", "Done"];

/** The embedded seed plus the extra projects, in the sheet's own row format
    (what /api/sheet/sync returns), dated up to today. */
export function sheetRows(today = new Date()) {
  const { epics, tasks } = sheetSnapshot(today);
  const fmt = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} 10:00:00`;
  const toRow = (r) => ({
    Key: r.key, Project: r.project, "Issue Type": r.type || (r.epic ? "Epic" : "Task"), Summary: r.summary || "",
    Assignee: r.assignee || "", Reporter: r.reporter || "", Desenvolvedor: r.developer || "", "Quem testou": r.tester || "",
    parent: r.parent || "", Status: r.status || "", "Tipo de entrega": r.tipo || "", Created: r.created || "",
    "Data de início": r.dataInicio || "", "Data Concluído": r.dataConcl || "", Priority: r.priority || "",
  });
  const extra = [];
  EXTRA_PROJECTS.forEach(({ project, prefix, epics: names }) => {
    let n = 1;
    names.forEach((summary, i) => {
      const epicKey = `${prefix}-${n++}`;
      const status = STATUSES[(i * 2) % STATUSES.length];
      extra.push(toRow({ key: epicKey, project, type: "Epic", epic: true, summary, status, tipo: "Inovação", reporter: "João Gonzalez", created: fmt(new Date(today.getTime() - (20 + i * 9) * DAY)) }));
      for (let t = 0; t < 4; t++) {
        const created = new Date(today.getTime() - (t * 3 + i) * DAY);
        extra.push(toRow({
          key: `${prefix}-${n++}`, project, type: ["Story", "Task", "Bug", "Task"][t], summary: `${summary} — parte ${t + 1}`,
          status: STATUSES[(t + i) % STATUSES.length], assignee: PEOPLE[(t + i) % PEOPLE.length], reporter: "João Gonzalez",
          parent: epicKey, tipo: ["Inovação", "Melhoria", "Sustentação"][t % 3], created: fmt(created),
        }));
      }
    });
  });
  return [...epics, ...tasks].map(toRow).concat(extra);
}
