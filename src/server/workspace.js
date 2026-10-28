/**
 * Workspaces (projetos): cada um com os próprios OKRs, iniciativas, features,
 * oportunidades, planilha e Roadmap. O workspace padrão (STLFLIX) usa as chaves
 * de sempre no Redis — nada foi migrado —; os outros têm as mesmas chaves com o
 * prefixo `ws:<id>:`.
 *
 * O workspace ativo viaja no cookie `pp-ws` (o navegador manda sozinho em todo
 * request). Cada adaptador de API troca o `config` do core por
 * `await scopeConfig(config, req.headers.cookie)`: o mesmo config, com um
 * cliente Redis que prefixa as chaves. Os cores não sabem que workspace existe.
 * Id desconhecido ou fora do formato cai no padrão — nunca cria chave nova.
 */
import { readCookie } from "./auth-core.js";

export const WS_COOKIE = "pp-ws";
export const DEFAULT_WS = "default";
export const REGISTRY_KEY = "jira:workspaces";
export const WS_ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** Conecta o cliente uma vez só, não importa por qual config (com ou sem
    escopo) ele foi pedido primeiro. */
export function baseReady(kv) {
  if (!kv.__ppReady) {
    kv.__ppReady = kv.isOpen || typeof kv.connect !== "function" ? Promise.resolve() : kv.connect();
  }
  return kv.__ppReady;
}

export const scopedKey = (ns, key) => (ns ? `ws:${ns}:${key}` : key);

/** Cliente com as chaves prefixadas — só os comandos que os cores usam. */
export function scopeKv(kv, ns) {
  const k = (key) => scopedKey(ns, key);
  return {
    connect: () => baseReady(kv),
    get: (key) => kv.get(k(key)),
    set: (key, value, opts) => (opts ? kv.set(k(key), value, opts) : kv.set(k(key), value)),
    del: (key) => kv.del(k(key)),
    eval: (script, opts) => kv.eval(script, { ...opts, keys: (opts.keys || []).map(k) }),
  };
}

export async function readRegistry(kv) {
  await baseReady(kv);
  const raw = await kv.get(REGISTRY_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Id do workspace pedido no cookie, já validado contra a lista. */
export async function resolveWorkspaceId(kv, cookieHeader) {
  const id = readCookie(cookieHeader || "", WS_COOKIE);
  if (!id || id === DEFAULT_WS || !WS_ID_RE.test(id)) return DEFAULT_WS;
  const registry = await readRegistry(kv);
  return registry.some((w) => w.id === id) ? id : DEFAULT_WS;
}

export function configForWorkspace(config, id) {
  const ns = id === DEFAULT_WS ? "" : id;
  return { ...config, kv: scopeKv(config.kv, ns), kvReady: null, workspace: id };
}

/** O `config` do core, apontando para o workspace do cookie. Config sem Redis
    (mal configurado) volta como está: o core já responde 503 nesse caso. */
export async function scopeConfig(config, cookieHeader) {
  if (!config || !config.kv || (config.missing && config.missing.length)) return config;
  return configForWorkspace(config, await resolveWorkspaceId(config.kv, cookieHeader));
}
