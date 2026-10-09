/**
 * Escrita no Jira a partir do Roadmap: criar, renomear e cancelar épicos.
 *
 * Roda nos dois lugares de sempre e por isso não conhece `req`/`res`: o plugin
 * do Vite (`jira-api.js`) e a função da Vercel (`api/jira/epics.js`).
 *
 * Credenciais: `JIRA_EMAIL` + `JIRA_API_TOKEN` (token de API do Jira Cloud),
 * só em variável de ambiente do servidor. `JIRA_BASE_URL` é opcional. Nada
 * disso chega ao navegador, e o token nunca entra em mensagem de erro.
 *
 * Ordem das operações, sempre: (1) valida sessão e posse, (2) chama o Jira,
 * (3) só então atualiza o documento do Roadmap. Se o Jira recusar, nada muda
 * aqui — o Jira é a fonte da verdade.
 *
 * Permissões (as mesmas do Roadmap): super mexe em qualquer épico; admin só
 * nos que ele criou (registro em `customEpics` com o e-mail dele em `createdBy`).
 *
 * "Excluir" nunca usa a API de exclusão do Jira: faz a transição do épico para
 * o status Cancelado (reversível) e o esconde do Roadmap.
 */
import { readDoc, writeDoc, touchDoc, viewDoc, canWriteSession, MAX_DESCRIPTION } from "./roadmap-core.js";

const DEFAULT_BASE_URL = "https://joaogonzalezstlflix.atlassian.net";

/** Produto do Roadmap -> chave do projeto no Jira (prefixo das chaves dos épicos). */
export const PRODUCT_TO_PROJECT = {
  "STLFLIX": "FLIX",
  "STL IA": "IA",
  "STL Seller": "SELLER",
  "STL Loja": "LOJA",
  "Backoffice": "BACK",
  "STL Academy": "ACADEMY",
};

const JIRA_KEY_RE = /^[A-Z][A-Z0-9]{1,9}-\d{1,9}$/;
const LOCAL_KEY_RE = /^NOVO-\d{1,12}$/;
/** Chave de épico que existe no Jira — `NOVO-*` é reservado a rascunhos locais. */
const isJiraKey = (k) => typeof k === "string" && JIRA_KEY_RE.test(k) && !LOCAL_KEY_RE.test(k);
/** Status final aceito como "cancelado", em ordem de preferência. */
const CANCEL_STATUSES = ["cancelado", "canceled", "cancelled", "arquivado", "archived"];
/** Opções do campo "Tipo de entrega" (as mesmas que o app já lê da planilha). */
export const TIPOS_ENTREGA = ["Inovação", "Melhoria", "Sustentação"];
const MAX_SUMMARY = 255;
const MAX_CAS_ATTEMPTS = 6;
const REQUEST_TIMEOUT_MS = 15000;

class JiraError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ---------------------------------------------------------------------
   Configuração
   --------------------------------------------------------------------- */

export function loadJiraConfig(env, fetchImpl) {
  const email = String(env.JIRA_EMAIL || "").trim();
  const token = String(env.JIRA_API_TOKEN || "").trim();
  const baseUrl = String(env.JIRA_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  const missing = [];
  if (!email) missing.push("JIRA_EMAIL");
  if (!token) missing.push("JIRA_API_TOKEN");
  if (!/^https:\/\/[^\s/]+$/.test(baseUrl)) missing.push("JIRA_BASE_URL (precisa ser https://…)");
  if (missing.length) return { missing };
  return {
    missing: [],
    baseUrl,
    authHeader: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
    fetch: fetchImpl || globalThis.fetch,
    typeCache: new Map(),
  };
}

export function jiraConfigError(j) {
  if (!j.missing.length) return null;
  return { status: 503, body: { message: `Integração com o Jira não configurada: defina ${j.missing.join(" e ")}` } };
}

/** Só diz se a integração está ligada — a tela usa pra decidir o que mostrar. */
export function handleStatus(j) {
  return { status: 200, body: { configured: !j.missing.length } };
}

/* ---------------------------------------------------------------------
   Cliente HTTP do Jira
   --------------------------------------------------------------------- */

function describeJiraBody(data) {
  if (!data || typeof data !== "object") return "";
  const parts = [...(Array.isArray(data.errorMessages) ? data.errorMessages : []), ...Object.values(data.errors || {})];
  return parts.filter((p) => typeof p === "string").join("; ").slice(0, 300);
}

function jiraHttpError(status, data) {
  const detail = describeJiraBody(data);
  const suffix = detail ? ` (${detail})` : "";
  if (status === 401) return new JiraError(502, "O Jira recusou as credenciais — confira JIRA_EMAIL e JIRA_API_TOKEN.");
  if (status === 403) return new JiraError(403, `A conta do Jira não tem permissão para essa ação${suffix}`);
  if (status === 404) return new JiraError(404, `Não encontrado no Jira${suffix}`);
  if (status === 400) {
    const err = new JiraError(400, `O Jira recusou${suffix || ": dados inválidos"}`);
    const hit = Object.entries(data?.errors || {}).find(([field, msg]) => /^customfield_\d+$/.test(field) && /epic name/i.test(String(msg)));
    if (hit) err.epicNameField = hit[0];
    if (typeof data?.errors?.description === "string") err.descriptionRejected = true;
    const tipoHit = Object.entries(data?.errors || {}).find(([field, msg]) => /^customfield_\d+$/.test(field) && norm(msg).includes("tipo de entrega"));
    if (tipoHit) err.tipoField = tipoHit[0];
    return err;
  }
  if (status === 429) return new JiraError(429, "O Jira limitou as requisições — tente de novo em instantes.");
  return new JiraError(502, `O Jira respondeu com erro ${status}${suffix}`);
}

async function jiraFetch(j, method, path, body) {
  let res;
  try {
    res = await j.fetch(`${j.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: j.authHeader,
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new JiraError(502, "Não consegui falar com o Jira (rede ou tempo esgotado).");
  }
  const text = await res.text().catch(() => "");
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }
  if (!res.ok) throw jiraHttpError(res.status, data);
  return data;
}

/** Compara texto ignorando maiúsculas e acentos ("Inovação" == "inovacao"). */
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const isEpicType = (t) => !!t && (t.hierarchyLevel === 1 || /^(epic|épico)$/i.test(t.name || ""));

async function epicTypeId(j, projectKey) {
  const cached = j.typeCache.get(projectKey);
  if (cached) return cached;
  const project = await jiraFetch(j, "GET", `/rest/api/3/project/${projectKey}`);
  const type = (project?.issueTypes || []).find(isEpicType);
  if (!type) throw new JiraError(409, `Não achei o tipo "Épico" no projeto ${projectKey} do Jira.`);
  j.typeCache.set(projectKey, type.id);
  return type.id;
}

/** Campos que o Jira pede ao criar um épico nesse projeto (paginado). Falha aqui não
    impede a criação: sem isso caímos no fallback guiado pelo erro do Jira. */
async function createFields(j, projectKey, typeId) {
  const all = [];
  for (let startAt = 0, page = 0; page < 10; page++) {
    const data = await jiraFetch(j, "GET", `/rest/api/3/issue/createmeta/${projectKey}/issuetypes/${typeId}?startAt=${startAt}&maxResults=100`);
    const values = Array.isArray(data?.values) ? data.values : [];
    all.push(...values);
    if (data?.isLast !== false || !values.length) break;
    startAt += values.length;
  }
  return all;
}

/** Monta o valor do campo "Tipo de entrega" no formato que o tipo do campo pede
    (lista simples, múltipla ou texto). `null` quando o projeto não tem o campo
    (ou não é obrigatório e nada foi escolhido). */
function resolveTipoEntrega(fields, tipo) {
  const f = fields.find((x) => norm(x?.name) === "tipo de entrega");
  if (!f) return null;
  const options = Array.isArray(f.allowedValues) ? f.allowedValues : [];
  const labelOf = (o) => o?.value ?? o?.name ?? "";
  const list = options.map(labelOf).filter(Boolean).join(", ") || TIPOS_ENTREGA.join(", ");
  if (!tipo) {
    if (f.required) throw new JiraError(400, `O projeto exige o Tipo de entrega — escolha uma opção (${list}).`);
    return null;
  }
  const isArray = f.schema?.type === "array";
  if (!options.length) return { fieldId: f.fieldId, value: isArray ? [tipo] : tipo };
  const match = options.find((o) => norm(labelOf(o)) === norm(tipo));
  if (!match) throw new JiraError(400, `O Jira não tem a opção "${tipo}" em Tipo de entrega. Opções: ${list}.`);
  const option = match.id !== undefined ? { id: String(match.id) } : { value: labelOf(match) };
  return { fieldId: f.fieldId, value: isArray ? [option] : option };
}

/** Cria o épico; projetos com "Epic Name" obrigatório respondem 400 apontando o campo. */
async function createJiraEpic(j, projectKey, summary, description, tipo) {
  const typeId = await epicTypeId(j, projectKey);
  let fields = { project: { key: projectKey }, issuetype: { id: typeId }, summary };

  // Tipo de entrega: descobre o campo do projeto (id, tipo e opções) e já manda o valor certo.
  try {
    const found = resolveTipoEntrega(await createFields(j, projectKey, typeId), tipo);
    if (found) fields = { ...fields, [found.fieldId]: found.value };
  } catch (e) {
    if (e instanceof JiraError && e.status === 400 && /Tipo de entrega/.test(e.message)) throw e; // regra de negócio, não falha de rede
    // createmeta indisponível: segue e deixa o erro do Jira guiar (abaixo)
  }

  let withDescription = false;
  if (description) {
    fields = { ...fields, description: descriptionToAdf(description) };
    withDescription = true;
  }
  const post = (f) => jiraFetch(j, "POST", "/rest/api/3/issue", { fields: f });
  const triedTipoArray = new Set();
  // Tenta, e a cada recusa conhecida do Jira corrige UMA coisa e tenta de novo:
  // "Epic Name" obrigatório -> preenche; descrição fora da tela do projeto -> cria sem ela;
  // "Tipo de entrega" exigido -> envia {value} e, se não servir, [{value}].
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const created = await post(fields);
      return { created, descriptionDropped: !!description && !withDescription };
    } catch (e) {
      if (!(e instanceof JiraError) || e.status !== 400) throw e;
      if (e.epicNameField && !(e.epicNameField in fields)) { fields = { ...fields, [e.epicNameField]: summary }; continue; }
      if (e.descriptionRejected && withDescription) {
        const { description: _drop, ...rest } = fields;
        fields = rest;
        withDescription = false;
        continue;
      }
      if (e.tipoField) {
        if (!tipo) throw new JiraError(400, `O projeto exige o Tipo de entrega — escolha uma opção (${TIPOS_ENTREGA.join(", ")}).`);
        if (!(e.tipoField in fields)) { fields = { ...fields, [e.tipoField]: { value: tipo } }; continue; }
        if (!triedTipoArray.has(e.tipoField)) { triedTipoArray.add(e.tipoField); fields = { ...fields, [e.tipoField]: [{ value: tipo }] }; continue; }
      }
      throw e;
    }
  }
  throw new JiraError(502, "O Jira continuou recusando a criação do épico");
}

async function getEpicIssue(j, key) {
  const issue = await jiraFetch(j, "GET", `/rest/api/3/issue/${key}?fields=status,issuetype,summary,assignee`);
  const fields = issue?.fields || {};
  if (!isEpicType(fields.issuetype)) throw new JiraError(409, `${key} não é um épico no Jira — não vou alterar.`);
  const a = fields.assignee;
  return {
    summary: fields.summary || "",
    status: fields.status?.name || "",
    assignee: a && a.accountId ? { accountId: a.accountId, displayName: a.displayName || "" } : null,
  };
}

/* ---------------------------------------------------------------------
   Validação e permissão
   --------------------------------------------------------------------- */

/** Texto simples -> documento ADF (o REST v3 do Jira só aceita descrição nesse formato).
    Linha em branco separa parágrafos; quebra simples vira quebra de linha. */
export function descriptionToAdf(text) {
  const blocks = String(text).replace(/\r\n?/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const content = blocks.map((block) => {
    const nodes = [];
    block.split("\n").forEach((line, i) => {
      if (i > 0) nodes.push({ type: "hardBreak" });
      if (line) nodes.push({ type: "text", text: line });
    });
    return { type: "paragraph", content: nodes };
  });
  return { type: "doc", version: 1, content };
}

function cleanTipo(v) {
  if (v === undefined || v === null || v === "") return "";
  const found = typeof v === "string" ? TIPOS_ENTREGA.find((t) => norm(t) === norm(v)) : null;
  if (!found) throw new JiraError(400, `Tipo de entrega inválido. Use: ${TIPOS_ENTREGA.join(", ")}.`);
  return found;
}

function cleanDescription(v) {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") throw new JiraError(400, "A descrição precisa ser um texto");
  const t = v.trim();
  if (t.length > MAX_DESCRIPTION) throw new JiraError(400, `A descrição passa de ${MAX_DESCRIPTION} caracteres`);
  return t;
}

/* ------------------------------ Responsável ------------------------------ */

const ACCOUNT_ID_RE = /^[A-Za-z0-9:_-]{6,128}$/;

/** `undefined` = sem mudança · `null` = remover o responsável · objeto = atribuir.
    O nome é obrigatório (é o que a tela mostra); `accountId` é opcional — sem ele,
    o servidor resolve a pessoa pelo nome entre as atribuíveis ao épico. */
function cleanAssigneeInput(v) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "object" || Array.isArray(v)) throw new JiraError(400, "Responsável inválido");
  const accountId = v.accountId === undefined || v.accountId === null || v.accountId === "" ? null : String(v.accountId);
  if (accountId !== null && !ACCOUNT_ID_RE.test(accountId)) throw new JiraError(400, "Responsável inválido");
  const displayName = typeof v.displayName === "string" ? v.displayName.trim().slice(0, 120) : "";
  if (!displayName) throw new JiraError(400, "Informe o nome do responsável");
  return { accountId, displayName };
}

/** Quem o Jira aceita como responsável (ativo, pessoa — sem apps/bots), por projeto ou por épico. */
async function searchAssignable(j, { projectKey, issueKey, query }) {
  const qs = new URLSearchParams({ maxResults: "200" });
  if (issueKey) qs.set("issueKey", issueKey);
  else qs.set("project", projectKey);
  if (query) qs.set("query", query);
  const users = await jiraFetch(j, "GET", `/rest/api/3/user/assignable/search?${qs}`);
  return (Array.isArray(users) ? users : [])
    .filter((u) => u && typeof u.accountId === "string" && u.active !== false && (!u.accountType || u.accountType === "atlassian"))
    .map((u) => ({ accountId: u.accountId, displayName: String(u.displayName || "").trim() }))
    .filter((u) => u.displayName)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
}

async function resolveAssigneeId(j, key, a) {
  if (a.accountId) return a.accountId;
  const users = await searchAssignable(j, { issueKey: key, query: a.displayName });
  const wanted = norm(a.displayName);
  const exact = users.filter((u) => norm(u.displayName) === wanted);
  if (exact.length === 1) return exact[0].accountId;
  if (exact.length > 1) throw new JiraError(409, `Há mais de uma pessoa chamada "${a.displayName}" no Jira — escolha pelo painel do épico.`);
  throw new JiraError(404, `Não encontrei "${a.displayName}" entre as pessoas que podem ser responsáveis por ${key}.`);
}

const assignInJira = (j, key, accountId) => jiraFetch(j, "PUT", `/rest/api/3/issue/${key}/assignee`, { accountId });

/** Lista de pessoas pro select de Responsável (só admin/super). `product` p/ rascunho, `key` p/ épico do Jira. */
export async function handleListAssignees(input, session, j) {
  const cfgErr = jiraConfigError(j);
  if (cfgErr) return cfgErr;
  if (!canWriteSession(session)) return forbidden("Sem permissão para listar pessoas do Jira");
  return wrap(async () => {
    if (input?.key) {
      if (!isJiraKey(input.key)) return bad("Chave de épico do Jira inválida");
      return { status: 200, body: { users: await searchAssignable(j, { issueKey: input.key }) } };
    }
    const projectKey = PRODUCT_TO_PROJECT[input?.product];
    if (!projectKey) return bad("Escolha o projeto para listar as pessoas");
    return { status: 200, body: { users: await searchAssignable(j, { projectKey }) } };
  });
}

const forbidden = (message = "Sem permissão para alterar épicos no Jira") => ({ status: 403, body: { message } });
const bad = (message) => ({ status: 400, body: { message } });

function cleanSummary(v) {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t && t.length <= MAX_SUMMARY ? t : null;
}

function cleanPosition(p) {
  if (p === undefined || p === null) return null;
  if (typeof p !== "object" || Array.isArray(p)) throw new JiraError(400, "Posição inválida");
  const lane = p.roadmapLane ?? null;
  if (lane !== null && (typeof lane !== "string" || !lane || lane.length > 60)) throw new JiraError(400, "Camada inválida");
  const sw = p.startWeek ?? null;
  if (sw !== null && !(Number.isInteger(sw) && sw >= -104 && sw <= 520)) throw new JiraError(400, "Semana inicial inválida");
  const dw = Number.isInteger(p.durationWeeks) ? p.durationWeeks : 2;
  if (dw < 1 || dw > 52) throw new JiraError(400, "Duração inválida");
  return { roadmapLane: lane, startWeek: sw, durationWeeks: dw };
}

const emailOf = (session) => session?.user?.email || null;

/** Super: qualquer épico. Admin: só os que ele criou aqui (registro com o e-mail dele). */
function mayTouchEpic(session, doc, key) {
  if (!canWriteSession(session)) return false;
  if (session.role === "super") return true;
  const email = emailOf(session);
  return !!email && doc.customEpics.some((e) => e.key === key && e.createdBy === email);
}

const wrap = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof JiraError) return { status: e.status, body: { message: e.message, ...(e.extra || {}) } };
    throw e;
  }
};

/* ---------------------------------------------------------------------
   Atualização do documento do Roadmap (compare-and-set com retry)
   --------------------------------------------------------------------- */

async function mutateDoc(rcfg, mutate) {
  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
    const { raw, doc } = await readDoc(rcfg);
    if (!doc) return { ok: false, reason: "not-initialized" };
    const next = mutate(doc);
    if (!next) return { ok: false, reason: "gone" };
    if (await writeDoc(rcfg, raw, next)) return { ok: true, doc: next };
  }
  return { ok: false, reason: "contention" };
}

const swapKey = (list, from, to) => {
  const out = [];
  for (const k of list) {
    const v = k === from ? to : k;
    if (!out.includes(v)) out.push(v);
  }
  return out;
};

const without = (list, key) => list.filter((k) => k !== key);

/* ---------------------------------------------------------------------
   Criar
   --------------------------------------------------------------------- */

function warningFor(newKey, { descriptionDropped, assignFailure }) {
  const parts = [];
  if (descriptionDropped) parts.push("o Jira não aceitou a descrição na tela desse projeto — ela ficou só aqui");
  if (assignFailure) parts.push(`não consegui definir o responsável (${assignFailure})`);
  return parts.length ? { warning: `Épico ${newKey} criado, mas ${parts.join(" e ")}.` } : {};
}

export async function handleCreateEpic(input, session, rcfg, j) {
  const cfgErr = jiraConfigError(j);
  if (cfgErr) return cfgErr;
  if (!canWriteSession(session)) return forbidden();
  return wrap(async () => {
    const oldKey = input?.key;
    const summary = cleanSummary(input?.summary);
    const product = input?.product;
    if (typeof oldKey !== "string" || !LOCAL_KEY_RE.test(oldKey)) return bad("Esse épico não é um rascunho local");
    if (!summary) return bad(`O nome do épico é obrigatório (até ${MAX_SUMMARY} caracteres)`);
    const projectKey = PRODUCT_TO_PROJECT[product];
    if (!projectKey) return bad("Escolha o produto (camada) antes de criar no Jira");
    const description = cleanDescription(input?.description);
    const tipo = cleanTipo(input?.tipo);
    const assignee = cleanAssigneeInput(input?.assignee);
    const position = cleanPosition(input?.position);
    if (position && position.roadmapLane !== null && position.roadmapLane !== product) {
      return bad("A camada do épico precisa ser o produto escolhido");
    }

    const { doc } = await readDoc(rcfg);
    if (!doc) return { status: 409, body: { code: "not-initialized", message: "O Roadmap ainda não foi migrado para o servidor" } };
    const draft = doc.customEpics.find((e) => e.key === oldKey);
    if (!draft) return { status: 404, body: { message: "Esse épico não existe mais (ou já foi criado no Jira)" } };
    if (!mayTouchEpic(session, doc, oldKey)) return forbidden("Esse épico é de outra pessoa");

    const { created, descriptionDropped } = await createJiraEpic(j, projectKey, summary, description, tipo);
    const newKey = created?.key;
    if (typeof newKey !== "string" || !JIRA_KEY_RE.test(newKey)) throw new JiraError(502, "O Jira não devolveu a chave do épico criado");

    let status = "Backlog";
    try {
      const issue = await jiraFetch(j, "GET", `/rest/api/3/issue/${newKey}?fields=status`);
      status = issue?.fields?.status?.name || status;
    } catch { /* o status é só informativo */ }

    // Responsável: depois de criado, pelo endpoint próprio de atribuição (não depende da tela de criação do projeto).
    let assignedName = null;
    let assignFailure = null;
    if (assignee) {
      try {
        await assignInJira(j, newKey, await resolveAssigneeId(j, newKey, assignee));
        assignedName = assignee.displayName;
      } catch (e) {
        if (!(e instanceof JiraError)) throw e;
        assignFailure = e.message;
      }
    }

    const email = emailOf(session);
    const result = await mutateDoc(rcfg, (cur) => {
      if (!cur.customEpics.some((e) => e.key === oldKey)) return null;
      const positions = { ...cur.positions };
      const oldPos = positions[oldKey];
      delete positions[oldKey];
      positions[newKey] = position || oldPos || { roadmapLane: null, startWeek: null, durationWeeks: 2 };
      return touchDoc({
        ...cur,
        customEpics: cur.customEpics.map((e) => (e.key === oldKey ? { ...e, key: newKey, project: product, summary, status, resumo: description || null, tipo: tipo || e.tipo || null, assignee: assignedName } : e)),
        positions,
        prioOrder: swapKey(cur.prioOrder, oldKey, newKey),
        filaProdutoOrder: swapKey(cur.filaProdutoOrder, oldKey, newKey),
        filaUxOrder: swapKey(cur.filaUxOrder, oldKey, newKey),
      }, email);
    });
    if (!result.ok) {
      const why = result.reason === "contention" ? "muitas alterações ao mesmo tempo" : "o rascunho sumiu daqui";
      return { status: 409, body: { message: `Criado no Jira como ${newKey}, mas não consegui atualizar o Roadmap (${why}). Recarregue a página.`, jiraKey: newKey } };
    }
    return {
      status: 200,
      body: {
        ...viewDoc(result.doc), key: newKey, oldKey,
        ...warningFor(newKey, { descriptionDropped, assignFailure }),
      },
    };
  });
}

/* ---------------------------------------------------------------------
   Renomear
   --------------------------------------------------------------------- */

async function renameInJira(j, key, summary) {
  let epicNameField = null;
  try {
    const meta = await jiraFetch(j, "GET", `/rest/api/3/issue/${key}/editmeta`);
    epicNameField = Object.entries(meta?.fields || {}).find(([, f]) => /^epic name$/i.test(f?.name || ""))?.[0] || null;
  } catch { /* sem editmeta, vai só o resumo */ }
  try {
    await jiraFetch(j, "PUT", `/rest/api/3/issue/${key}`, { fields: { summary, ...(epicNameField ? { [epicNameField]: summary } : {}) } });
  } catch (e) {
    if (epicNameField && e instanceof JiraError && e.status === 400) {
      await jiraFetch(j, "PUT", `/rest/api/3/issue/${key}`, { fields: { summary } });
      return;
    }
    throw e;
  }
}

/** Altera o nome e/ou o responsável de um épico do Jira (e do Roadmap, no mesmo passo). */
export async function handleUpdateEpic(input, session, rcfg, j) {
  const cfgErr = jiraConfigError(j);
  if (cfgErr) return cfgErr;
  if (!canWriteSession(session)) return forbidden();
  return wrap(async () => {
    const key = input?.key;
    if (!isJiraKey(key)) return bad("Chave de épico do Jira inválida");
    const hasSummary = input?.summary !== undefined;
    const summary = hasSummary ? cleanSummary(input.summary) : null;
    if (hasSummary && !summary) return bad(`O nome do épico é obrigatório (até ${MAX_SUMMARY} caracteres)`);
    const assignee = cleanAssigneeInput(input?.assignee);
    if (!hasSummary && assignee === undefined) return bad("Nada para alterar");

    const { doc } = await readDoc(rcfg);
    if (!doc) return { status: 409, body: { code: "not-initialized", message: "O Roadmap ainda não foi migrado para o servidor" } };
    if (!mayTouchEpic(session, doc, key)) return forbidden("Esse épico não é seu");

    const current = await getEpicIssue(j, key);
    const patch = {};
    if (hasSummary) {
      if (current.summary !== summary) await renameInJira(j, key, summary);
      patch.summary = summary;
    }
    if (assignee !== undefined) {
      if (assignee === null) {
        if (current.assignee) await assignInJira(j, key, null);
      } else {
        const accountId = await resolveAssigneeId(j, key, assignee);
        if (current.assignee?.accountId !== accountId) await assignInJira(j, key, accountId);
      }
      patch.assignee = assignee ? assignee.displayName : null;
    }

    const at = new Date().toISOString();
    const result = await mutateDoc(rcfg, (cur) => touchDoc({
      ...cur,
      customEpics: cur.customEpics.map((e) => (e.key === key ? { ...e, ...patch } : e)),
      epicOverrides: { ...cur.epicOverrides, [key]: { ...(cur.epicOverrides[key] || {}), ...patch, at } },
    }, emailOf(session)));
    if (!result.ok) return { status: 409, body: { message: "Atualizado no Jira, mas não consegui atualizar o Roadmap. Recarregue a página." } };
    return { status: 200, body: { ...viewDoc(result.doc), key } };
  });
}

export const handleRenameEpic = handleUpdateEpic;

/* ---------------------------------------------------------------------
   Cancelar ("excluir")
   --------------------------------------------------------------------- */

const isCancelStatus = (name) => CANCEL_STATUSES.includes(String(name || "").toLowerCase());

async function cancelInJira(j, key, currentStatus) {
  if (isCancelStatus(currentStatus)) return; // já está cancelado: idempotente
  const data = await jiraFetch(j, "GET", `/rest/api/3/issue/${key}/transitions`);
  const transitions = Array.isArray(data?.transitions) ? data.transitions : [];
  let pick = null;
  for (const wanted of CANCEL_STATUSES) {
    pick = transitions.find((t) => String(t?.to?.name || "").toLowerCase() === wanted);
    if (pick) break;
  }
  if (!pick) {
    const options = transitions.map((t) => t?.to?.name).filter(Boolean).join(", ") || "nenhuma";
    throw new JiraError(409, `Não achei como mover ${key} para Cancelado a partir de "${currentStatus}". Transições disponíveis: ${options}.`);
  }
  await jiraFetch(j, "POST", `/rest/api/3/issue/${key}/transitions`, { transition: { id: pick.id } });
}

export async function handleCancelEpic(input, session, rcfg, j) {
  const cfgErr = jiraConfigError(j);
  if (cfgErr) return cfgErr;
  if (!canWriteSession(session)) return forbidden();
  return wrap(async () => {
    const key = input?.key;
    if (!isJiraKey(key)) return bad("Chave de épico do Jira inválida");

    const { doc } = await readDoc(rcfg);
    if (!doc) return { status: 409, body: { code: "not-initialized", message: "O Roadmap ainda não foi migrado para o servidor" } };
    if (!mayTouchEpic(session, doc, key)) return forbidden("Esse épico não é seu");

    const current = await getEpicIssue(j, key);
    await cancelInJira(j, key, current.status);

    const result = await mutateDoc(rcfg, (cur) => {
      const positions = { ...cur.positions };
      delete positions[key];
      return touchDoc({
        ...cur,
        customEpics: cur.customEpics.filter((e) => e.key !== key),
        positions,
        prioOrder: without(cur.prioOrder, key),
        filaProdutoOrder: without(cur.filaProdutoOrder, key),
        filaUxOrder: without(cur.filaUxOrder, key),
        // esconde também a versão que ainda vem da planilha, até ela sincronizar
        epicOverrides: { ...cur.epicOverrides, [key]: { ...(cur.epicOverrides[key] || {}), removed: true } },
      }, emailOf(session));
    });
    if (!result.ok) return { status: 409, body: { message: "Cancelado no Jira, mas não consegui atualizar o Roadmap. Recarregue a página." } };
    return { status: 200, body: { ...viewDoc(result.doc), key } };
  });
}
