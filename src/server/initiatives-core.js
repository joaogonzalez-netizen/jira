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
 * Usa `@upstash/redis` (e não `@vercel/kv`, descontinuado) contra a mesma API
 * REST do KV/Redis conectado ao projeto — `KV_REST_API_URL`/`KV_REST_API_TOKEN`
 * são o par de variáveis que a integração da Vercel injeta de qualquer forma.
 */
import { Redis } from "@upstash/redis";
import { loadConfig as loadAuthConfig, readCookie, resolveSession, AUTH_COOKIE } from "./auth-core.js";

const KV_KEY = "jira:initiatives";

export function loadConfig(env) {
  const url = String(env.KV_REST_API_URL || "");
  const token = String(env.KV_REST_API_TOKEN || "");
  const missing = [];
  if (!url) missing.push("KV_REST_API_URL");
  if (!token) missing.push("KV_REST_API_TOKEN");
  if (missing.length) return { missing };

  const authConfig = loadAuthConfig(env);
  return { missing: [], kv: new Redis({ url, token }), authConfig };
}

export function configError(config) {
  if (!config.missing.length) return null;
  return {
    status: 503,
    body: { message: `Iniciativas não configuradas: defina ${config.missing.join(" e ")} (Vercel KV)` },
  };
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
  const list = await config.kv.get(KV_KEY);
  return Array.isArray(list) ? list : [];
}

async function writeAll(config, list) {
  await config.kv.set(KV_KEY, list);
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

  const list = await readAll(config);
  const initiative = {
    id: genId(),
    name,
    product,
    epicKeys: [],
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
