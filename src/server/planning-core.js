/**
 * Camadas de planejamento que não existem no Jira nem na planilha, guardadas só
 * neste app: OKRs (Objetivos e Key Results), a árvore de Oportunidades com os
 * Experimentos de growth, e as Features de cada produto. As Iniciativas ficam
 * em `initiatives-core.js` (a mesma lista que o Roadmap já usa) e os épicos e
 * produtos vêm do Jira.
 *
 *   Objetivo → Key Result → Iniciativa (→ épicos) e Oportunidade → Experimento
 *   Produto (Jira) → Feature (→ épicos)
 *
 * Mesmo desenho das Iniciativas: uma lista JSON por tipo no Redis, leitura
 * pública, escrita só para `admin` ou `super`. Um core para todos os tipos
 * (`kind`), porque o CRUD é idêntico e só os campos mudam — cada tipo declara
 * os seus em `fields`. Roda no plugin do Vite (`planning-api.js`) e na função
 * da Vercel (`api/planning.js`), por isso não conhece `req` nem `res`.
 */
import { loadConfig as loadInitiativesConfig, resolveSessionFromCookie } from "./initiatives-core.js";
import { runMigrations } from "./legacy-migration.js";
import { baseReady } from "./workspace.js";
import { QUARTER_RE, cleanLinks } from "./links.js";

export { resolveSessionFromCookie };

const SCORE = { type: "score" }; // 1–10, ou null
// Acompanhamento semanal: [{ week (segunda-feira, AAAA-MM-DD), value, note }].
// O último check-in vira o valor corrente do campo `mirror`.
const checkins = (mirror) => ({ type: "checkins", mirror });

export const KINDS = {
  objectives: {
    key: "jira:objectives",
    prefix: "obj",
    label: "Objetivo",
    fields: {
      product: { type: "text", required: true }, // produto do Jira que o OKR mira
      goal: { type: "text" }, // meta do objetivo, em uma frase (os números ficam nos KRs)
      description: { type: "text" },
      period: { type: "text" }, // legado (ex.: 2026-T4); hoje o período são as datas
      startDate: { type: "date" },
      endDate: { type: "date" },
      status: { type: "enum", options: ["Em andamento", "Concluído", "Cancelado"], default: "Em andamento" },
    },
  },
  // Key Result = o número que prova o objetivo E o trabalho que o move
  // (épicos do Jira) — Iniciativa virou parte dele.
  keyResults: {
    key: "jira:key-results",
    prefix: "kr",
    label: "Key Result",
    parent: { field: "objectiveId", kind: "objectives" },
    fields: {
      objectiveId: { type: "ref", required: true },
      owner: { type: "text" }, // responsável (nome como aparece no Jira)
      product: { type: "text" },
      quarter: { type: "quarter" }, // Q1/2026
      links: { type: "links" },
      epicKeys: { type: "list" }, // um épico fica num KR só
      description: { type: "text" },
      unit: { type: "text" }, // %, R$, usuários…
      baseline: { type: "number" },
      target: { type: "number" },
      current: { type: "number" },
      dueDate: { type: "date" },
      status: { type: "enum", options: ["Planejado", "Em andamento", "Pausado", "Concluído", "Cancelado"], default: "Em andamento" },
      checkins: checkins("current"),
    },
  },
  opportunities: {
    key: "jira:opportunities",
    prefix: "opp",
    label: "Oportunidade",
    parent: { field: "keyResultId", kind: "keyResults" },
    fields: {
      keyResultId: { type: "ref", required: true },
      parentId: { type: "ref" }, // sub-oportunidade
      track: { type: "enum", options: ["", "UX", "Conteúdos", "Negócios"], default: "" }, // ramo fixo da árvore
      description: { type: "text" }, // dor, evidência
      links: { type: "links" }, // estudos, dashboards
      status: { type: "enum", options: ["Aberta", "Explorando", "Validada", "Descartada"], default: "Aberta" },
    },
  },
  // Árvore de oportunidades: Oportunidade → Solução (como satisfazer a
  // necessidade) → Experimento (como validar a solução).
  solutions: {
    key: "jira:solutions",
    prefix: "sol",
    label: "Solução",
    parent: { field: "opportunityId", kind: "opportunities" },
    fields: {
      opportunityId: { type: "ref", required: true },
      description: { type: "text" },
      status: { type: "enum", options: ["Ideia", "Priorizada", "Em teste", "Validada", "Descartada"], default: "Ideia" },
    },
  },
  experiments: {
    key: "jira:experiments",
    prefix: "exp",
    label: "Experimento",
    parent: { field: "opportunityId", kind: "opportunities" },
    fields: {
      opportunityId: { type: "ref", required: true },
      solutionId: { type: "ref" }, // opcional: a solução que o experimento valida
      hypothesis: { type: "text" },
      metric: { type: "text" },
      unit: { type: "text" },
      baseline: { type: "number" },
      target: { type: "number" },
      result: { type: "number" },
      startDate: { type: "date" },
      dueDate: { type: "date" },
      status: { type: "enum", options: ["Ideia", "Rodando", "Analisando", "Concluído"], default: "Ideia" },
      outcome: { type: "enum", options: ["", "Validado", "Invalidado", "Inconclusivo"], default: "" },
      impact: SCORE,
      confidence: SCORE,
      ease: SCORE,
      epicKey: { type: "ref" }, // épico do Jira em que o experimento virou
      checkins: checkins("result"),
    },
  },
  features: {
    key: "jira:features",
    prefix: "feat",
    label: "Feature",
    fields: {
      product: { type: "text", required: true },
      description: { type: "text" },
      status: { type: "enum", options: ["Ativa", "Em construção", "Descontinuada"], default: "Ativa" },
      epicKeys: { type: "list" },
    },
  },
};

// Quem aponta para cada tipo — apagar um pai com filhos é recusado, para não
// deixar KR sem objetivo ou experimento sem oportunidade.
const CHILDREN = {};
for (const [kind, def] of Object.entries(KINDS)) {
  if (def.parent) (CHILDREN[def.parent.kind] = CHILDREN[def.parent.kind] || []).push({ kind, field: def.parent.field });
}
CHILDREN.opportunities = [...(CHILDREN.opportunities || []), { kind: "opportunities", field: "parentId" }];
CHILDREN.solutions = [...(CHILDREN.solutions || []), { kind: "experiments", field: "solutionId" }];

// hasOwn: `KINDS["constructor"]` existiria via protótipo e passaria na validação.
function isKind(kind) {
  return typeof kind === "string" && Object.hasOwn(KINDS, kind);
}

export function loadConfig(env) {
  return loadInitiativesConfig(env);
}

export function configError(config) {
  if (!config.missing.length) return null;
  return {
    status: 503,
    body: { message: `Planejamento não configurado: defina ${config.missing.join(" e ")} (Redis, Vercel Storage)` },
  };
}

async function ensureConnected(config) {
  if (!config.kvReady) config.kvReady = baseReady(config.kv);
  await config.kvReady;
  return config.kv;
}

function canWrite(session) {
  return !!session && (session.role === "admin" || session.role === "super");
}

function forbidden() {
  return { status: 403, body: { message: "Sem permissão para gerenciar o planejamento" } };
}

function unknownKind() {
  return { status: 400, body: { message: `kind deve ser um de: ${Object.keys(KINDS).join(", ")}` } };
}

async function readAll(config, kind) {
  const client = await ensureConnected(config);
  const raw = await client.get(KINDS[kind].key);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeAll(config, kind, list) {
  const client = await ensureConnected(config);
  await client.set(KINDS[kind].key, JSON.stringify(list));
}

function genId(kind) {
  return `${KINDS[kind].prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Segunda-feira da semana de uma data AAAA-MM-DD (null se inválida). */
export function mondayOf(iso) {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Um check-in por semana (o último enviado vale), em ordem cronológica. */
function coerceCheckins(value) {
  if (!Array.isArray(value)) return undefined;
  const byWeek = new Map();
  for (const c of value) {
    const week = c && mondayOf(c.week);
    const v = c ? toNumber(c.value) : null;
    if (!week || v === null) continue;
    byWeek.set(week, { week, value: v, note: typeof c.note === "string" ? c.note.trim().slice(0, 280) : "" });
  }
  return [...byWeek.values()].sort((a, b) => a.week.localeCompare(b.week)).slice(-260);
}

/** Converte um valor do cliente para o tipo do campo. `undefined` = valor
    inválido, o campo fica como estava. */
function coerce(spec, value) {
  switch (spec.type) {
    case "text":
    case "ref":
      return typeof value === "string" ? value.trim() : undefined;
    case "enum":
      return typeof value === "string" && spec.options.includes(value) ? value : undefined;
    case "date":
      if (typeof value !== "string") return undefined;
      return value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
    case "number": {
      if (value === null || value === "") return null;
      const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
      return Number.isFinite(n) ? n : undefined;
    }
    case "score": {
      if (value === null || value === "") return null;
      const n = Number(value);
      return Number.isInteger(n) && n >= 1 && n <= 10 ? n : undefined;
    }
    case "checkins":
      return coerceCheckins(value);
    case "links":
      return cleanLinks(value);
    case "quarter":
      return typeof value === "string" && (value === "" || QUARTER_RE.test(value)) ? value : undefined;
    case "list":
      return Array.isArray(value) ? [...new Set(value.filter((v) => typeof v === "string" && v))] : undefined;
    default:
      return undefined;
  }
}

/** Aplica só os campos reconhecidos de `patch` sobre `base`. Nome vazio é
    ignorado (nome é obrigatório), assim como um campo obrigatório vazio. */
export function applyFields(kind, base, patch) {
  const next = { ...base };
  if (typeof patch.name === "string" && patch.name.trim()) next.name = patch.name.trim();
  for (const [field, spec] of Object.entries(KINDS[kind].fields)) {
    if (!(field in patch)) continue;
    const value = coerce(spec, patch[field]);
    if (value === undefined) continue;
    if (spec.required && !value) continue;
    next[field] = value;
    if (spec.mirror && value.length) next[spec.mirror] = value[value.length - 1].value;
  }
  return next;
}

function defaults(kind) {
  const out = {};
  for (const [field, spec] of Object.entries(KINDS[kind].fields)) {
    if (spec.type === "enum") out[field] = spec.default;
    else if (spec.type === "list" || spec.type === "checkins" || spec.type === "links") out[field] = [];
    else if (spec.type === "number" || spec.type === "score") out[field] = null;
    else out[field] = "";
  }
  return out;
}

/** Põe `item` na lista (no índice `at`, ou no fim). Em Features e Key Results
    um épico fica num só: os épicos de `item` saem dos outros. */
const EXCLUSIVE_EPICS = new Set(["features", "keyResults"]);
function releaseEpics(kind, others, item, at = others.length) {
  const mine = EXCLUSIVE_EPICS.has(kind) ? new Set(item.epicKeys || []) : null;
  const rest = mine && mine.size
    ? others.map((o) => ((o.epicKeys || []).some((k) => mine.has(k)) ? { ...o, epicKeys: o.epicKeys.filter((k) => !mine.has(k)) } : o))
    : others;
  return [...rest.slice(0, at), item, ...rest.slice(at)];
}

export async function handleList(kind, config) {
  if (!isKind(kind)) return unknownKind();
  await runMigrations(await ensureConnected(config));
  return { status: 200, body: await readAll(config, kind) };
}

export async function handleCreate(kind, input, session, config) {
  if (!isKind(kind)) return unknownKind();
  if (!canWrite(session)) return forbidden();
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) return { status: 400, body: { message: "Nome é obrigatório" } };

  const def = KINDS[kind];
  const base = { id: genId(kind), name, ...defaults(kind), createdBy: session.user.email || null, createdAt: new Date().toISOString() };
  const item = applyFields(kind, base, input);
  const missing = Object.entries(def.fields).find(([field, spec]) => spec.required && !item[field]);
  if (missing) return { status: 400, body: { message: `${missing[0]} é obrigatório` } };

  await writeAll(config, kind, releaseEpics(kind, await readAll(config, kind), item));
  return { status: 201, body: item };
}

export async function handleUpdate(kind, id, patch, session, config) {
  if (!isKind(kind)) return unknownKind();
  if (!canWrite(session)) return forbidden();
  if (!id) return { status: 400, body: { message: "id é obrigatório" } };

  const list = await readAll(config, kind);
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return { status: 404, body: { message: `${KINDS[kind].label} não encontrado` } };

  const next = applyFields(kind, list[idx], patch);
  await writeAll(config, kind, releaseEpics(kind, list.filter((_, i) => i !== idx), next, idx));
  return { status: 200, body: next };
}

export async function handleDelete(kind, id, session, config) {
  if (!isKind(kind)) return unknownKind();
  if (!canWrite(session)) return forbidden();
  if (!id) return { status: 400, body: { message: "id é obrigatório" } };

  const list = await readAll(config, kind);
  if (!list.some((i) => i.id === id)) return { status: 404, body: { message: `${KINDS[kind].label} não encontrado` } };

  for (const child of CHILDREN[kind] || []) {
    const children = await readAll(config, child.kind);
    const count = children.filter((c) => c[child.field] === id).length;
    if (count) {
      return { status: 409, body: { message: `Não dá para excluir: ${count} ${KINDS[child.kind].label.toLowerCase()}(s) ainda dependem deste item` } };
    }
  }

  await writeAll(config, kind, list.filter((i) => i.id !== id));
  return { status: 200, body: { ok: true } };
}
