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
  if (!config.kvReady) config.kvReady = config.kv.connect();
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

function genId() {
  return `init_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function handleList(config) {
  return { status: 200, body: await readAll(config) };
}

export async function handleCreate(input, session, config) {
  if (!canWrite(session)) return forbidden();
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const product = typeof input.product === "string" ? input.product.trim() : "";
  if (!name || !product) return { status: 400, body: { message: "Nome e produto são obrigatórios" } };

  const startDate = typeof input.startDate === "string" && input.startDate.trim() ? input.startDate.trim() : null;
  const endDate = typeof input.endDate === "string" && input.endDate.trim() ? input.endDate.trim() : null;

  const list = await readAll(config);
  const initiative = {
    id: genId(),
    name,
    product,
    epicKeys: [],
    startDate,
    endDate,
    createdBy: session.user.email || null,
    createdAt: new Date().toISOString(),
  };
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
  if (typeof patch.product === "string" && patch.product.trim()) next.product = patch.product.trim();
  if (Array.isArray(patch.epicKeys)) next.epicKeys = patch.epicKeys.filter((k) => typeof k === "string");
  // `startDate`/`endDate` aceitam string (nova data) ou `null` explícito (limpar) —
  // só `undefined` (campo ausente do patch) deixa o valor atual intacto.
  if (patch.startDate !== undefined) next.startDate = typeof patch.startDate === "string" && patch.startDate.trim() ? patch.startDate.trim() : null;
  if (patch.endDate !== undefined) next.endDate = typeof patch.endDate === "string" && patch.endDate.trim() ? patch.endDate.trim() : null;

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
