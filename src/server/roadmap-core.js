/**
 * Roadmap compartilhado — posições no Gantt, épicos criados à mão e as três
 * filas (priorização, Produto, UX). Antes isso morava só no `localStorage` de
 * cada navegador; aqui vira um documento único no Redis, igual às iniciativas,
 * pra todo mundo ver as mesmas mudanças.
 *
 * Roda nos dois lugares de sempre e por isso não conhece `req`/`res`: o plugin
 * do Vite (`roadmap-api.js`, dev e preview) e as funções da Vercel
 * (`api/roadmap/*.js`, produção).
 *
 * Leitura é pública (mesma exposição das iniciativas). Escrita exige sessão e
 * REPETE aqui as regras que a tela já aplica (`ownsCard`, `canWriteShared` em
 * auth-context.jsx) — o comentário de lá já avisava que, quando o board saísse
 * do navegador, o gate tinha que viver no servidor:
 *   super — qualquer mudança.
 *   admin — só cria/edita/exclui os próprios épicos criados à mão (createdBy =
 *           e-mail dele) e mexe nas filas só pra entrar/sair com esses cards.
 *           Não toca épico da planilha, nem reordena as filas.
 *   user  — leitura.
 *
 * A escrita é um read-modify-write com compare-and-set (Lua no Redis): se outra
 * pessoa gravou no meio, relê e reaplica. Cliente manda só o que mudou (um
 * "diff" por chave), então duas pessoas mexendo em cards diferentes nunca se
 * sobrescrevem.
 */
import { createClient } from "redis";
import { loadConfig as loadAuthConfig, readCookie, resolveSession, AUTH_COOKIE } from "./auth-core.js";

const STATE_KEY = "jira:roadmap";
const SNAPSHOT_KEY = "jira:sheet-snapshot";
const SNAPSHOT_AT_KEY = "jira:sheet-snapshot-at";

const MAX_KEYS = 3000;
const MAX_SNAPSHOT_BYTES = 3.5 * 1024 * 1024;
const MAX_CAS_ATTEMPTS = 6;

const KEY_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;
const CUSTOM_KEY_RE = /^NOVO-\d{1,12}$/;

/** Troca o valor só se ainda for o que lemos (`""` = chave inexistente). */
export const CAS_SCRIPT = `
local cur = redis.call('GET', KEYS[1])
if cur == false then cur = '' end
if cur == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2])
  return 1
end
return 0`;

/** KV em memória com a mesma semântica do Redis usada aqui — pra testes e pro
    dev server sem Redis. Nunca usado em produção. */
export function createMemoryKv() {
  const store = new Map();
  return {
    store,
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async set(key, value) { store.set(key, String(value)); return "OK"; },
    async eval(script, { keys, arguments: args }) {
      if (script !== CAS_SCRIPT) throw new Error("memory kv: script desconhecido");
      const cur = store.has(keys[0]) ? store.get(keys[0]) : "";
      if (cur !== args[0]) return 0;
      store.set(keys[0], args[1]);
      return 1;
    },
  };
}

let devKv = null;
/** Um único KV em memória por processo — os plugins de dev (roadmap e Jira) precisam enxergar o mesmo documento. */
export function sharedMemoryKv() {
  if (!devKv) devKv = createMemoryKv();
  return devKv;
}

export function loadConfig(env, injectedKv) {
  const authConfig = loadAuthConfig(env);
  if (injectedKv) return { missing: [], kv: injectedKv, kvReady: Promise.resolve(), authConfig };

  const url = String(env.REDIS_URL || "");
  if (!url) return { missing: ["REDIS_URL"] };
  const client = createClient({ url });
  client.on("error", (err) => console.error("[roadmap] erro de conexão com o Redis:", err));
  return { missing: [], kv: client, kvReady: null, authConfig };
}

export function configError(config) {
  if (!config.missing.length) return null;
  return {
    status: 503,
    body: { message: `Roadmap compartilhado indisponível: defina ${config.missing.join(" e ")} (Redis, Vercel Storage)` },
  };
}

async function ensureConnected(config) {
  if (!config.kvReady) config.kvReady = config.kv.connect ? config.kv.connect() : Promise.resolve();
  await config.kvReady;
  return config.kv;
}

export async function resolveSessionFromCookie(cookieHeader, config) {
  if (config.authConfig.missing.length) return null;
  const token = readCookie(cookieHeader, AUTH_COOKIE);
  if (!token) return null;
  return resolveSession(token, config.authConfig);
}

/* ---------------------------------------------------------------------
   Validação — tudo que vem do cliente passa por aqui antes de virar estado
   --------------------------------------------------------------------- */

class ValidationError extends Error {}

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function cleanKey(k) {
  if (typeof k !== "string" || !KEY_RE.test(k)) throw new ValidationError(`Chave inválida: ${String(k).slice(0, 40)}`);
  return k;
}

function cleanKeyList(list, label) {
  if (!Array.isArray(list)) throw new ValidationError(`${label} precisa ser uma lista`);
  if (list.length > MAX_KEYS) throw new ValidationError(`${label} grande demais`);
  const seen = new Set();
  const out = [];
  for (const k of list) {
    cleanKey(k);
    if (!seen.has(k)) { seen.add(k); out.push(k); }
  }
  return out;
}

function cleanPosition(p) {
  if (!isPlainObject(p)) throw new ValidationError("Posição inválida");
  const lane = p.roadmapLane;
  if (lane !== null && (typeof lane !== "string" || !lane || lane.length > 60)) throw new ValidationError("Camada inválida");
  const sw = p.startWeek;
  if (sw !== null && !(Number.isInteger(sw) && sw >= -104 && sw <= 520)) throw new ValidationError("Semana inicial inválida");
  const dw = p.durationWeeks;
  if (!(Number.isInteger(dw) && dw >= 1 && dw <= 52)) throw new ValidationError("Duração inválida");
  return { roadmapLane: lane, startWeek: sw, durationWeeks: dw };
}

const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : null);

function cleanEpic(e) {
  if (!isPlainObject(e)) throw new ValidationError("Épico inválido");
  if (typeof e.key !== "string" || !CUSTOM_KEY_RE.test(e.key)) throw new ValidationError("Chave de épico inválida");
  if (typeof e.summary !== "string" || e.summary.length > 300) throw new ValidationError("Nome do épico inválido");
  return {
    key: e.key,
    project: str(e.project, 60),
    summary: e.summary,
    assignee: str(e.assignee, 120),
    reporter: str(e.reporter, 120),
    status: str(e.status, 60) || "Rascunho",
    tipo: str(e.tipo, 60),
    created: str(e.created, 40),
    priority: str(e.priority, 40),
    epic: true,
    createdBy: str(e.createdBy, 160),
  };
}

function cleanPositionsMap(map, label, { allowNull }) {
  if (!isPlainObject(map)) throw new ValidationError(`${label} inválido`);
  const keys = Object.keys(map);
  if (keys.length > MAX_KEYS) throw new ValidationError(`${label} grande demais`);
  const out = {};
  for (const k of keys) {
    cleanKey(k);
    out[k] = map[k] === null && allowNull ? null : cleanPosition(map[k]);
  }
  return out;
}

function normalizeDiff(diff) {
  if (!isPlainObject(diff)) throw new ValidationError("Corpo inválido");
  const out = { positions: {}, positionsIfAbsent: {}, customUpsert: [], customRemove: [], orders: {} };
  if (diff.positions !== undefined) out.positions = cleanPositionsMap(diff.positions, "positions", { allowNull: true });
  if (diff.positionsIfAbsent !== undefined) out.positionsIfAbsent = cleanPositionsMap(diff.positionsIfAbsent, "positionsIfAbsent", { allowNull: false });
  if (diff.customEpics !== undefined) {
    if (!isPlainObject(diff.customEpics)) throw new ValidationError("customEpics inválido");
    const { upsert = [], remove = [] } = diff.customEpics;
    if (!Array.isArray(upsert) || upsert.length > MAX_KEYS) throw new ValidationError("customEpics.upsert inválido");
    out.customUpsert = upsert.map(cleanEpic);
    out.customRemove = cleanKeyList(remove, "customEpics.remove");
  }
  for (const name of ["prioOrder", "filaProdutoOrder", "filaUxOrder"]) {
    if (diff[name] !== undefined) out.orders[name] = normalizeOrderOp(diff[name], name);
  }
  return out;
}

/** Fila trafega como operação: `{ add, remove }` (entrar no fim / sair) ou
    `{ set }` (reordenar). Uma lista pura vale como `set`. */
function normalizeOrderOp(v, label) {
  if (Array.isArray(v)) return { set: cleanKeyList(v, label) };
  if (!isPlainObject(v)) throw new ValidationError(`${label} inválido`);
  if (v.set !== undefined) return { set: cleanKeyList(v.set, label) };
  return { add: cleanKeyList(v.add ?? [], `${label}.add`), remove: cleanKeyList(v.remove ?? [], `${label}.remove`) };
}

/* ---------------------------------------------------------------------
   Documento e permissões
   --------------------------------------------------------------------- */

function emptyDoc() {
  return { v: 1, rev: 0, updatedAt: null, updatedBy: null, positions: {}, customEpics: [], epicOverrides: {}, prioOrder: [], filaProdutoOrder: [], filaUxOrder: [] };
}

function parseDoc(raw) {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (!isPlainObject(d)) return null;
    return {
      ...emptyDoc(),
      ...d,
      positions: isPlainObject(d.positions) ? d.positions : {},
      customEpics: Array.isArray(d.customEpics) ? d.customEpics : [],
      epicOverrides: isPlainObject(d.epicOverrides) ? d.epicOverrides : {},
      prioOrder: Array.isArray(d.prioOrder) ? d.prioOrder : [],
      filaProdutoOrder: Array.isArray(d.filaProdutoOrder) ? d.filaProdutoOrder : [],
      filaUxOrder: Array.isArray(d.filaUxOrder) ? d.filaUxOrder : [],
    };
  } catch {
    return null;
  }
}

/** O que o cliente enxerga — sem a metadata interna. */
function view(doc, extra = {}) {
  return {
    state: {
      positions: doc.positions,
      customEpics: doc.customEpics,
      epicOverrides: doc.epicOverrides || {},
      prioOrder: doc.prioOrder,
      filaProdutoOrder: doc.filaProdutoOrder,
      filaUxOrder: doc.filaUxOrder,
    },
    rev: doc.rev,
    updatedAt: doc.updatedAt,
    ...extra,
  };
}

function canWrite(session) {
  return !!session && (session.role === "admin" || session.role === "super");
}

const forbidden = (message = "Sem permissão para alterar o Roadmap") => ({ status: 403, body: { message } });

/** Admin só pode entrar/sair das filas com cards dele e sem reordenar o resto. */
function adminMayChangeOrder(oldArr, newArr, ownsKey) {
  const oldSet = new Set(oldArr);
  const newSet = new Set(newArr);
  for (const k of newArr) if (!oldSet.has(k) && !ownsKey(k)) return false;
  for (const k of oldArr) if (!newSet.has(k) && !ownsKey(k)) return false;
  const keptOld = oldArr.filter((k) => newSet.has(k));
  const keptNew = newArr.filter((k) => oldSet.has(k));
  return keptOld.length === keptNew.length && keptOld.every((k, i) => k === keptNew[i]);
}

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Aplica um diff a um documento. Pura (sem I/O) — é o que os testes exercitam.
 * Devolve `{ doc, changed }` ou `{ error: { status, body } }`.
 */
export function applyDiff(doc, rawDiff, session) {
  let diff;
  try {
    diff = normalizeDiff(rawDiff);
  } catch (e) {
    if (e instanceof ValidationError) return { error: { status: 400, body: { message: e.message } } };
    throw e;
  }

  const isSuper = session.role === "super";
  const email = session.user?.email || null;
  if (!isSuper && !email) return { error: forbidden() };

  const existingCustom = new Map(doc.customEpics.map((e) => [e.key, e]));
  const ownsExisting = (k) => isSuper || existingCustom.get(k)?.createdBy === email;

  // 1) épicos criados à mão
  const nextCustom = new Map(existingCustom);
  const newKeys = new Set();
  for (const raw of diff.customUpsert) {
    const prev = existingCustom.get(raw.key);
    if (prev) {
      if (!ownsExisting(raw.key)) return { error: forbidden("Esse épico é de outra pessoa") };
      nextCustom.set(raw.key, { ...raw, createdBy: prev.createdBy });
    } else {
      newKeys.add(raw.key);
      nextCustom.set(raw.key, { ...raw, createdBy: isSuper ? raw.createdBy || email : email });
    }
  }
  for (const k of diff.customRemove) {
    if (existingCustom.has(k) && !ownsExisting(k)) return { error: forbidden("Esse épico é de outra pessoa") };
    nextCustom.delete(k);
  }

  // dono de uma chave pra fins de posição/fila: já existia dele, ou é dele e acabou de ser criado
  const ownsKey = (k) => isSuper || ownsExisting(k) || (newKeys.has(k) && nextCustom.get(k)?.createdBy === email);

  // 2) posições
  const nextPositions = { ...doc.positions };
  for (const [k, v] of Object.entries(diff.positions)) {
    if (!ownsKey(k)) return { error: forbidden("Esse card não é seu") };
    if (v === null) delete nextPositions[k];
    else nextPositions[k] = v;
  }
  for (const [k, v] of Object.entries(diff.positionsIfAbsent)) {
    if (!isSuper) return { error: forbidden("Só o superusuário posiciona épicos da planilha") };
    if (!Object.prototype.hasOwnProperty.call(nextPositions, k)) nextPositions[k] = v;
  }

  // 3) filas
  const next = { ...doc, positions: nextPositions, customEpics: [...nextCustom.values()] };
  for (const [name, op] of Object.entries(diff.orders)) {
    const current = doc[name];
    if (op.set) {
      if (!isSuper && !adminMayChangeOrder(current, op.set, ownsKey)) {
        return { error: forbidden("Reordenar as filas é só do superusuário") };
      }
      next[name] = op.set;
      continue;
    }
    if (!isSuper && [...op.add, ...op.remove].some((k) => !ownsKey(k))) {
      return { error: forbidden("Só dá pra mexer na fila com cards seus") };
    }
    const removing = new Set(op.remove);
    const kept = current.filter((k) => !removing.has(k));
    const present = new Set(kept);
    next[name] = [...kept, ...op.add.filter((k) => !present.has(k) && !removing.has(k))];
  }

  const changed =
    !sameJson(next.positions, doc.positions) ||
    !sameJson(next.customEpics, doc.customEpics) ||
    !sameJson(next.prioOrder, doc.prioOrder) ||
    !sameJson(next.filaProdutoOrder, doc.filaProdutoOrder) ||
    !sameJson(next.filaUxOrder, doc.filaUxOrder);
  if (!changed) return { doc, changed: false };

  return { doc: { ...next, rev: doc.rev + 1, updatedAt: new Date().toISOString(), updatedBy: email }, changed: true };
}

/* ---------------------------------------------------------------------
   Handlers
   --------------------------------------------------------------------- */

async function readRaw(config, key) {
  const kv = await ensureConnected(config);
  return kv.get(key);
}

async function casWrite(config, key, expectedRaw, nextRaw) {
  const kv = await ensureConnected(config);
  const r = await kv.eval(CAS_SCRIPT, { keys: [key], arguments: [expectedRaw || "", nextRaw] });
  return Number(r) === 1;
}

export async function handleGet(config) {
  const raw = await readRaw(config, STATE_KEY);
  const snapshotAt = (await readRaw(config, SNAPSHOT_AT_KEY)) || null;
  const doc = parseDoc(raw);
  if (!doc) return { status: 200, body: { state: null, rev: 0, updatedAt: null, snapshotAt } };
  return { status: 200, body: view(doc, { snapshotAt }) };
}

export async function handlePatch(rawDiff, session, config) {
  if (!canWrite(session)) return forbidden();
  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
    const raw = await readRaw(config, STATE_KEY);
    const doc = parseDoc(raw);
    if (!doc) {
      return { status: 409, body: { code: "not-initialized", message: "O Roadmap ainda não foi migrado para o servidor" } };
    }
    const result = applyDiff(doc, rawDiff, session);
    if (result.error) return result.error;
    if (!result.changed) return { status: 200, body: view(doc) };
    if (await casWrite(config, STATE_KEY, raw, JSON.stringify(result.doc))) return { status: 200, body: view(result.doc) };
  }
  return { status: 503, body: { message: "Muitas alterações ao mesmo tempo — tente de novo" } };
}

/** Primeira carga do servidor: só o super, só se ainda não existe estado. Aceita
    o `roadmap-v1` do navegador (ou um backup .json) e, opcionalmente, o snapshot
    da planilha que estava em `jira-data-override-v1`. */
export async function handleSeed(body, session, config) {
  if (!session || session.role !== "super") return forbidden("Só o superusuário pode migrar o Roadmap");
  let doc;
  try {
    if (!isPlainObject(body) || !isPlainObject(body.state)) throw new ValidationError("Corpo inválido");
    const s = body.state;
    const positions = cleanPositionsMap(s.positions ?? {}, "positions", { allowNull: false });
    const customEpics = (Array.isArray(s.customEpics) ? s.customEpics : []).map(cleanEpic);
    if (customEpics.length > MAX_KEYS) throw new ValidationError("customEpics grande demais");
    doc = {
      ...emptyDoc(),
      rev: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user?.email || null,
      positions,
      customEpics,
      prioOrder: cleanKeyList(s.prioOrder ?? [], "prioOrder"),
      filaProdutoOrder: cleanKeyList(s.filaProdutoOrder ?? s.filaOrder ?? [], "filaProdutoOrder"),
      filaUxOrder: cleanKeyList(s.filaUxOrder ?? [], "filaUxOrder"),
    };
  } catch (e) {
    if (e instanceof ValidationError) return { status: 400, body: { message: e.message } };
    throw e;
  }

  if (!(await casWrite(config, STATE_KEY, "", JSON.stringify(doc)))) {
    return { status: 409, body: { code: "already-initialized", message: "O Roadmap já está no servidor" } };
  }
  if (body.snapshot) {
    const snap = await handleSnapshotPut(body.snapshot, session, config);
    if (snap.status !== 200) return { status: 201, body: { ...view(doc), snapshotError: snap.body.message } };
  }
  const snapshotAt = (await readRaw(config, SNAPSHOT_AT_KEY)) || null;
  return { status: 201, body: view(doc, { snapshotAt }) };
}

/* ---------------------------------------------------------------------
   Snapshot da planilha (epics + tasks do último "Atualizar")
   --------------------------------------------------------------------- */

export async function handleSnapshotGet(config) {
  const raw = await readRaw(config, SNAPSHOT_KEY);
  if (!raw) return { status: 200, body: { snapshot: null } };
  try {
    return { status: 200, body: { snapshot: JSON.parse(raw) } };
  } catch {
    return { status: 200, body: { snapshot: null } };
  }
}

export async function handleSnapshotPut(input, session, config) {
  if (!session || session.role !== "super") return forbidden("Só o superusuário publica a planilha sincronizada");
  if (!isPlainObject(input) || !Array.isArray(input.epics) || !Array.isArray(input.tasks)) {
    return { status: 400, body: { message: "Snapshot inválido" } };
  }
  const syncedAt = typeof input.syncedAt === "string" && input.syncedAt ? input.syncedAt.slice(0, 40) : new Date().toISOString();
  const raw = JSON.stringify({ epics: input.epics, tasks: input.tasks, syncedAt });
  if (raw.length > MAX_SNAPSHOT_BYTES) return { status: 413, body: { message: "Snapshot grande demais" } };
  const kv = await ensureConnected(config);
  await kv.set(SNAPSHOT_KEY, raw);
  await kv.set(SNAPSHOT_AT_KEY, syncedAt);
  return { status: 200, body: { syncedAt } };
}

/* ---------------------------------------------------------------------
   Acesso ao documento para outros módulos do servidor (jira-core)
   --------------------------------------------------------------------- */

export async function readDoc(config) {
  const raw = await readRaw(config, STATE_KEY);
  return { raw, doc: parseDoc(raw) };
}

/** Grava `nextDoc` só se o documento ainda for `expectedRaw` (compare-and-set). */
export async function writeDoc(config, expectedRaw, nextDoc) {
  return casWrite(config, STATE_KEY, expectedRaw, JSON.stringify(nextDoc));
}

/** Carimba revisão/autor — todo caminho que muda o documento passa por aqui. */
export function touchDoc(doc, email) {
  return { ...doc, rev: doc.rev + 1, updatedAt: new Date().toISOString(), updatedBy: email || null };
}

export { view as viewDoc, canWrite as canWriteSession };
