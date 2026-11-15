/**
 * Leitura do Jira pela API oficial (REST v3), no lugar da planilha
 * "[Dados] Jira 2". Devolve linhas no MESMO formato que a planilha entregava —
 * um objeto por issue, chaveado pelo cabeçalho da coluna ("Key", "Project",
 * "Status"…) — para que `transformSheetRow` no cliente e tudo que vem depois
 * (Roadmap, Entregas, filas) continuem como estão.
 *
 * Roda nos dois lugares de sempre e por isso não conhece `req`/`res`: o plugin
 * do Vite (`jira-api.js`) e a função da Vercel (`api/jira/assignees.js`, que já
 * abriga as outras leituras — o plano aceita no máximo 12 funções).
 *
 * Credenciais e erros são os de `jira-core.js` (`JIRA_EMAIL` + `JIRA_API_TOKEN`
 * só no servidor). Só lê: nada aqui altera o Jira.
 */
import { JiraError, jiraConfigError, jiraFetch, norm } from "./jira-core.js";
import { canWriteSession } from "./roadmap-core.js";

const PAGE_SIZE = 100; // teto do Jira por página em /search/jql
const MAX_PAGES_PER_PROJECT = 200; // trava de segurança: 20 mil issues por projeto
const MAX_RETRIES = 3;
const TIMEZONE = "America/Sao_Paulo"; // a planilha mostrava as datas no horário de Brasília
const BASE_FIELDS = ["summary", "status", "issuetype", "project", "assignee", "reporter", "parent", "priority", "created"];

/** Coluna da planilha -> nome do campo no Jira (comparado sem acento nem caixa, sem espaço sobrando). */
const CUSTOM_FIELD_NAMES = {
  "Desenvolvedor": "Desenvolvedor",
  "Quem testou": "Quem testou",
  "Tipo de entrega": "Tipo de entrega",
  "Data de início": "Data de início",
  "Data Concluído": "Data Concluído",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Id de cada campo customizado, achado pelo nome (os ids mudam de instância pra instância). */
async function resolveFieldIds(j) {
  if (!j.fieldIdsPromise) {
    j.fieldIdsPromise = jiraFetch(j, "GET", "/rest/api/3/field").then((list) => {
      const byName = new Map();
      for (const f of Array.isArray(list) ? list : []) {
        if (f && f.custom && typeof f.id === "string" && !byName.has(norm(f.name))) byName.set(norm(f.name), f.id);
      }
      const ids = {};
      for (const [column, name] of Object.entries(CUSTOM_FIELD_NAMES)) ids[column] = byName.get(norm(name)) || null;
      return ids;
    });
    j.fieldIdsPromise.catch(() => { j.fieldIdsPromise = null; }); // falha não fica em cache
  }
  return j.fieldIdsPromise;
}

/** POST com nova tentativa quando o Jira limita a taxa (429). */
async function searchPage(j, body) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await jiraFetch(j, "POST", "/rest/api/3/search/jql", body);
    } catch (e) {
      if (!(e instanceof JiraError) || e.status !== 429 || attempt >= MAX_RETRIES) throw e;
      await sleep(500 * (attempt + 1));
    }
  }
}

async function fetchProjectIssues(j, projectKey, fields) {
  const issues = [];
  let nextPageToken;
  for (let page = 0; page < MAX_PAGES_PER_PROJECT; page++) {
    const data = await searchPage(j, {
      jql: `project = ${projectKey} ORDER BY created DESC`,
      fields,
      maxResults: PAGE_SIZE,
      ...(nextPageToken ? { nextPageToken } : {}),
    });
    issues.push(...(Array.isArray(data?.issues) ? data.issues : []));
    nextPageToken = data?.nextPageToken;
    if (!nextPageToken) return issues;
  }
  throw new JiraError(502, `O projeto ${projectKey} passou do limite de leitura (${MAX_PAGES_PER_PROJECT * PAGE_SIZE} issues).`);
}

/* ---------------------------- formatos da planilha ---------------------------- */

/** "2026-11-05T17:36:13.555-0300" -> "05/11/2026 17:36:13" (horário de Brasília). */
export function formatDateTime(value) {
  if (typeof value !== "string" || !value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, hourCycle: "h23", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(d).map((p) => [p.type, p.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
}

/** "2026-11-05" -> "05/11/2026". */
export function formatDate(value) {
  const m = typeof value === "string" && value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

const personName = (u) => (u && typeof u.displayName === "string" ? u.displayName : "");
const optionName = (o) => (o && typeof o === "object" ? o.value ?? o.name ?? "" : typeof o === "string" ? o : "");

/** Uma issue do Jira como a linha da planilha: mesmas colunas, mesmos formatos. */
export function issueToRow(issue, ids) {
  const f = issue?.fields || {};
  const custom = (column) => (ids[column] ? f[ids[column]] : undefined);
  return {
    "Key": String(issue?.key || ""),
    "Project": f.project?.name || "",
    "Issue Type": f.issuetype?.name || "",
    "Summary": f.summary || "",
    "Status": f.status?.name || "",
    "Assignee": personName(f.assignee),
    "Reporter": personName(f.reporter),
    "Desenvolvedor": personName(custom("Desenvolvedor")),
    "Quem testou": personName(custom("Quem testou")),
    "parent": f.parent?.key || "",
    "Tipo de entrega": optionName(Array.isArray(custom("Tipo de entrega")) ? custom("Tipo de entrega")[0] : custom("Tipo de entrega")),
    "Created": formatDateTime(f.created),
    "Data de início": formatDate(custom("Data de início")),
    "Data Concluído": formatDate(custom("Data Concluído")),
    "Priority": f.priority?.name || "",
    "_created": f.created || "", // só para ordenar; removido antes de responder
  };
}

/* --------------------------------- leitura --------------------------------- */

/**
 * Todas as issues dos projetos pedidos. Um projeto por vez em paralelo (a
 * paginação do Jira é sequencial dentro de cada consulta), mais novas primeiro
 * — a mesma ordem da planilha.
 */
export async function fetchIssueRows(j, projectKeys) {
  const ids = await resolveFieldIds(j);
  const fields = [...BASE_FIELDS, ...Object.values(ids).filter(Boolean)];
  const perProject = await Promise.all(projectKeys.map((key) => fetchProjectIssues(j, key, fields)));
  return perProject
    .flat()
    .map((issue) => issueToRow(issue, ids))
    .filter((row) => row["Key"])
    .sort((a, b) => (a._created < b._created ? 1 : a._created > b._created ? -1 : 0))
    .map(({ _created, ...row }) => row);
}

/**
 * Sync de um workspace, no mesmo contrato de `handleWorkspaceSync` (planilha):
 * os projetos do Jira marcados no workspace filtram a leitura (por nome do
 * projeto); o padrão (STLFLIX) lê todos os projetos que a conta enxerga.
 * Workspace que não é o padrão e não marcou projeto é recusado — não cai em
 * "tudo". Só admin/super dispara (cada leitura custa dezenas de chamadas).
 */
export async function handleIssues({ workspace = null, isDefault = true } = {}, session, j) {
  const cfgErr = jiraConfigError(j);
  if (cfgErr) return cfgErr;
  if (!canWriteSession(session)) return { status: 403, body: { message: "Sem permissão para ler o Jira por aqui" } };
  const scoped = workspace && Array.isArray(workspace.jiraProjects) && workspace.jiraProjects.length ? new Set(workspace.jiraProjects.map(norm)) : null;
  if (!isDefault && !scoped) {
    return { status: 409, body: { message: "Este projeto ainda não tem projetos do Jira: marque-os em Editar projeto" } };
  }
  try {
    const projects = await jiraFetch(j, "GET", "/rest/api/3/project");
    const keys = (Array.isArray(projects) ? projects : [])
      .filter((p) => p && typeof p.key === "string" && /^[A-Z][A-Z0-9_]*$/.test(p.key) && (!scoped || scoped.has(norm(p.name))))
      .map((p) => p.key);
    return { status: 200, body: await fetchIssueRows(j, keys) };
  } catch (e) {
    if (e instanceof JiraError) return { status: e.status, body: { message: e.message } };
    throw e;
  }
}
