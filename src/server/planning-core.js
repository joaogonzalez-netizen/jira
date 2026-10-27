/**
 * Objetivos, Features e Releases — as camadas de planejamento que não existem no
 * Jira nem na planilha (o produto e as iniciativas — épicos — vêm do Jira), guardadas só dentro deste app. Mesmo desenho das
 * Iniciativas (`initiatives-core.js`): uma lista JSON por tipo no Redis, leitura
 * pública, escrita só para `admin` ou `super`.
 *
 * Um core para os dois tipos (`kind`), porque o CRUD é idêntico e só os campos
 * mudam. Roda no plugin do Vite (`planning-api.js`) e na função da Vercel
 * (`api/planning.js`), por isso não conhece `req` nem `res`.
 */
import { loadConfig as loadInitiativesConfig, resolveSessionFromCookie } from "./initiatives-core.js";

export { resolveSessionFromCookie };

export const KINDS = {
  objectives: {
    key: "jira:objectives",
    prefix: "obj",
    label: "Objetivo",
    statuses: ["Em andamento", "Concluído", "Cancelado"],
    defaultStatus: "Em andamento",
    links: "epicKeys", // iniciativa = épico do Jira
  },
  features: {
    key: "jira:features",
    prefix: "feat",
    label: "Feature",
    statuses: ["Ativa", "Em construção", "Descontinuada"],
    defaultStatus: "Ativa",
    links: "epicKeys", // épicos que entregam ou evoluem a feature
  },
  releases: {
    key: "jira:releases",
    prefix: "rel",
    label: "Release",
    statuses: ["Planejada", "Lançada", "Cancelada"],
    defaultStatus: "Planejada",
    links: "epicKeys",
  },
};

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
  if (!config.kvReady) config.kvReady = config.kv.connect();
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
  return { status: 400, body: { message: "kind deve ser objectives, features ou releases" } };
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

function strList(value) {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string" && v) : null;
}

/** Aplica só os campos reconhecidos de `patch` sobre `base`. Texto vazio no
    nome é ignorado (nome é obrigatório); `description` e `date` aceitam vazio. */
export function applyFields(kind, base, patch) {
  const def = KINDS[kind];
  const next = { ...base };
  if (typeof patch.name === "string" && patch.name.trim()) next.name = patch.name.trim();
  if (typeof patch.description === "string") next.description = patch.description.trim();
  if (typeof patch.status === "string" && def.statuses.includes(patch.status)) next.status = patch.status;
  const links = strList(patch[def.links]);
  if (links) next[def.links] = [...new Set(links)];
  if (kind === "features" && typeof patch.product === "string" && patch.product.trim()) next.product = patch.product.trim();
  if (kind === "releases" && typeof patch.date === "string") {
    const d = patch.date.trim();
    if (d === "" || /^\d{4}-\d{2}-\d{2}$/.test(d)) next.date = d;
  }
  return next;
}

export async function handleList(kind, config) {
  if (!isKind(kind)) return unknownKind();
  return { status: 200, body: await readAll(config, kind) };
}

export async function handleCreate(kind, input, session, config) {
  if (!isKind(kind)) return unknownKind();
  if (!canWrite(session)) return forbidden();
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) return { status: 400, body: { message: "Nome é obrigatório" } };
  const product = typeof input.product === "string" ? input.product.trim() : "";
  if (kind === "features" && !product) return { status: 400, body: { message: "Produto é obrigatório" } };

  const def = KINDS[kind];
  const base = {
    id: genId(kind),
    name,
    description: "",
    status: def.defaultStatus,
    [def.links]: [],
    ...(kind === "releases" ? { date: "" } : {}),
    ...(kind === "features" ? { product } : {}),
    createdBy: session.user.email || null,
    createdAt: new Date().toISOString(),
  };
  const item = applyFields(kind, base, input);
  await writeAll(config, kind, [...(await readAll(config, kind)), item]);
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
  await writeAll(config, kind, list.map((item, i) => (i === idx ? next : item)));
  return { status: 200, body: next };
}

export async function handleDelete(kind, id, session, config) {
  if (!isKind(kind)) return unknownKind();
  if (!canWrite(session)) return forbidden();
  if (!id) return { status: 400, body: { message: "id é obrigatório" } };

  const list = await readAll(config, kind);
  const next = list.filter((i) => i.id !== id);
  if (next.length === list.length) return { status: 404, body: { message: `${KINDS[kind].label} não encontrado` } };

  await writeAll(config, kind, next);
  return { status: 200, body: { ok: true } };
}
