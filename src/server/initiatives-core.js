/**
 * Iniciativas — camada entre Produto e Épico, criada e mantida só dentro
 * deste app (não vem da planilha). Persistida no Vercel KV como um blob só
 * (uma lista JSON sob uma chave), no mesmo espírito do `DATA_OVERRIDE_KEY`
 * que o board já guarda no localStorage — o volume é dezenas de itens, não
 * precisa de uma chave por iniciativa.
 *
 * Roda em dois lugares e por isso não conhece nem `req` nem `res`, igual a
 * `auth-core.js` e `sheet-core.js`: o plugin do Vite (`initiatives-api.js`,
 * dev e preview) e a função da Vercel (`api/initiatives.js`, produção).
 *
 * Leitura é pública (mesma exposição que o board já tem hoje). Escrita exige
 * sessão válida com papel `admin` ou `super` — reaproveita `resolveSession`
 * de `auth-core.js` — porque aqui, ao contrário do sync da planilha, existe
 * escrita real: o gate não pode viver só no cliente.
 *
 * Usa `redis` (node-redis v4), conectando direto por `REDIS_URL` — a
 * variável que a integração "Redis" da Vercel (marketplace) injeta no
 * projeto. O cliente é criado uma vez por cold start (`loadConfig` roda no
 * escopo do módulo, não por request) e a conexão é aberta de forma
 * preguiçosa e só uma vez, reaproveitada entre invocações warm.
 */
import { createClient } from "redis";
import { loadConfig as loadAuthConfig, readCookie, resolveSession, AUTH_COOKIE } from "./auth-core.js";
import { runMigrations } from "./legacy-migration.js";
import { baseReady } from "./workspace.js";
import { QUARTER_RE, cleanLinks } from "./links.js";

const KV_KEY = "jira:initiatives";

export function loadConfig(env) {
  const url = String(env.REDIS_URL || "");
  const missing = [];
  if (!url) missing.push("REDIS_URL");
  if (missing.length) return { missing };

  const authConfig = loadAuthConfig(env);
  const client = createClient({ url });
  client.on("error", (err) => console.error("[initiatives] erro de conexão com o Redis:", err));
  return { missing: [], kv: client, kvReady: null, authConfig };
}

export function configError(config) {
  if (!config.missing.length) return null;
  return {
    status: 503,
    body: { message: `Iniciativas não configuradas: defina ${config.missing.join(" e ")} (Redis, Vercel Storage)` },
  };
}

/** Garante que o client conectou antes de usar — só chama `.connect()` uma
    vez mesmo com requests concorrentes na mesma instância (cold start). */
async function ensureConnected(config) {
  if (!config.kvReady) config.kvReady = baseReady(config.kv);
  await config.kvReady;
  return config.kv;
}

/** Sessão do request a partir do cookie — `null` quando não configurado ou
    sem sessão válida (mesmas regras do login: fail-closed). */
export async function resolveSessionFromCookie(cookieHeader, config) {
  if (config.authConfig.missing.length) return null;
  const token = readCookie(cookieHeader, AUTH_COOKIE);
  if (!token) return null;
  return resolveSession(token, config.authConfig);
}

function canWrite(session) {
  return !!session && (session.role === "admin" || session.role === "super");
}

function forbidden() {
  return { status: 403, body: { message: "Sem permissão para gerenciar iniciativas" } };
}

async function readAll(config) {
  const client = await ensureConnected(config);
  const raw = await client.get(KV_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeAll(config, list) {
  const client = await ensureConnected(config);
  await client.set(KV_KEY, JSON.stringify(list));
}

export const INITIATIVE_STATUSES = ["Planejada", "Em andamento", "Concluída", "Pausada", "Cancelada"];

/** Campos opcionais da iniciativa: descrição, data de entrega, quarter (Q1/2026),
    links, o objetivo a que pertence e o KR que ela move (ids de
    `jira:objectives` e `jira:key-results`, vazio = nenhum). */
function applyOptional(next, input) {
  if (typeof input.description === "string") next.description = input.description.trim();
  if (typeof input.dueDate === "string" && (input.dueDate === "" || /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate))) next.dueDate = input.dueDate;
  if (typeof input.quarter === "string" && (input.quarter === "" || QUARTER_RE.test(input.quarter))) next.quarter = input.quarter;
  const links = cleanLinks(input.links);
  if (links) next.links = links;
  if (typeof input.keyResultId === "string") next.keyResultId = input.keyResultId.trim();
  if (typeof input.objectiveId === "string") next.objectiveId = input.objectiveId.trim();
  if (typeof input.status === "string" && INITIATIVE_STATUSES.includes(input.status)) next.status = input.status;
  return next;
}

function genId() {
  return `init_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function handleList(config) {
  await runMigrations(await ensureConnected(config));
  return { status: 200, body: await readAll(config) };
}

export async function handleCreate(input, session, config) {
  if (!canWrite(session)) return forbidden();
  const name = typeof input.name === "string" ? input.name.trim() : "";
  // Produto é opcional: uma iniciativa como "Reduzir cancelamento" cruza
  // produtos; os produtos dela aparecem pelos épicos vinculados.
  const product = typeof input.product === "string" ? input.product.trim() : "";
  if (!name) return { status: 400, body: { message: "Nome é obrigatório" } };

  const list = await readAll(config);
  const initiative = applyOptional({
    id: genId(),
    name,
    product,
    description: "",
    status: "Planejada",
    objectiveId: "",
    keyResultId: "",
    dueDate: "",
    quarter: "",
    links: [],
    epicKeys: [],
    createdBy: session.user.email || null,
    createdAt: new Date().toISOString(),
  }, input);
  await writeAll(config, [...list, initiative]);
  return { status: 201, body: initiative };
}

export async function handleUpdate(id, patch, session, config) {
  if (!canWrite(session)) return forbidden();
  if (!id) return { status: 400, body: { message: "id é obrigatório" } };

  const list = await readAll(config);
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return { status: 404, body: { message: "Iniciativa não encontrada" } };

  const next = { ...list[idx] };
  if (typeof patch.name === "string" && patch.name.trim()) next.name = patch.name.trim();
  if (typeof patch.product === "string") next.product = patch.product.trim();
  applyOptional(next, patch);
  if (Array.isArray(patch.epicKeys)) next.epicKeys = patch.epicKeys.filter((k) => typeof k === "string");

  // Um épico pertence no máximo a uma iniciativa: ao gravar `epicKeys` aqui,
  // remove esses épicos de qualquer outra iniciativa que os tivesse.
  const nextList = list.map((item, i) => {
    if (i === idx) return next;
    if (!Array.isArray(patch.epicKeys) || !patch.epicKeys.length) return item;
    const filtered = item.epicKeys.filter((k) => !next.epicKeys.includes(k));
    return filtered.length === item.epicKeys.length ? item : { ...item, epicKeys: filtered };
  });

  await writeAll(config, nextList);
  return { status: 200, body: next };
}

export async function handleDelete(id, session, config) {
  if (!canWrite(session)) return forbidden();
  if (!id) return { status: 400, body: { message: "id é obrigatório" } };

  const list = await readAll(config);
  const next = list.filter((i) => i.id !== id);
  if (next.length === list.length) return { status: 404, body: { message: "Iniciativa não encontrada" } };

  await writeAll(config, next);
  return { status: 200, body: { ok: true } };
}
