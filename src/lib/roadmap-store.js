/**
 * Cliente do Roadmap compartilhado (`/api/roadmap`). Só fala HTTP e calcula o
 * que mudou — o estado em si mora no `DataProvider`.
 *
 * O servidor recebe um "diff" (só as chaves alteradas), nunca o documento
 * inteiro: assim duas pessoas mexendo em cards diferentes não se sobrescrevem.
 */

async function call(method, url, body) {
  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { message: "Sem conexão com o servidor" } };
  }
}

/** Sempre objeto novo: arrays compartilhados entre usos virariam estado mutável global. */
export const emptyRoadmap = () => ({ positions: {}, customEpics: [], prioOrder: [], filaProdutoOrder: [], filaUxOrder: [] });

export const roadmapStore = {
  /** `ok` (tem estado) | `empty` (servidor ainda sem Roadmap) | `unavailable`. */
  async fetchState() {
    const r = await call("GET", "/api/roadmap");
    if (!r.ok) return { kind: "unavailable", status: r.status, message: r.data?.message };
    const snapshotAt = r.data.snapshotAt || null;
    if (!r.data.state) return { kind: "empty", snapshotAt };
    return { kind: "ok", state: r.data.state, rev: r.data.rev, snapshotAt };
  },

  async patch(diff) {
    const r = await call("PATCH", "/api/roadmap", diff);
    if (r.ok) return { ok: true, state: r.data.state, rev: r.data.rev };
    return { ok: false, status: r.status, code: r.data?.code, message: r.data?.message || `HTTP ${r.status}` };
  },

  async seed(state, snapshot) {
    const r = await call("POST", "/api/roadmap", { state, snapshot: snapshot || undefined });
    if (r.ok) return { ok: true, state: r.data.state, rev: r.data.rev, snapshotAt: r.data.snapshotAt || null };
    return { ok: false, status: r.status, code: r.data?.code, message: r.data?.message || `HTTP ${r.status}` };
  },

  async fetchSnapshot() {
    const r = await call("GET", "/api/roadmap/snapshot");
    return r.ok && r.data.snapshot ? r.data.snapshot : null;
  },

  async putSnapshot(snapshot) {
    const r = await call("PUT", "/api/roadmap/snapshot", snapshot);
    return r.ok ? { ok: true } : { ok: false, message: r.data?.message || `HTTP ${r.status}` };
  },
};

/* ---------------------------------------------------------------------
   Diff entre o último estado conhecido do servidor e o estado local
   --------------------------------------------------------------------- */

const eqJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// A tela às vezes monta posição sem durationWeeks (ex.: soltar card sem posição
// prévia na priorização) — o padrão em todo lugar é 2.
function normPos(p) {
  return {
    roadmapLane: p && p.roadmapLane != null ? p.roadmapLane : null,
    startWeek: p && p.startWeek != null ? p.startWeek : null,
    durationWeeks: p && Number.isInteger(p.durationWeeks) ? p.durationWeeks : 2,
  };
}

const EPIC_FIELDS = ["key", "project", "summary", "assignee", "reporter", "status", "tipo", "created", "priority", "createdBy"];
const pickEpic = (e) => Object.fromEntries(EPIC_FIELDS.map((f) => [f, e[f] ?? null]));

/** Fila: entrar no fim/sair viram `add`/`remove` (não dependem da ordem atual
    do servidor); qualquer outra coisa (reordenar) vira `set`. */
function orderOp(baseArr, nextArr) {
  if (eqJson(baseArr, nextArr)) return null;
  const baseSet = new Set(baseArr);
  const nextSet = new Set(nextArr);
  const removed = baseArr.filter((k) => !nextSet.has(k));
  const kept = baseArr.filter((k) => nextSet.has(k));
  const added = nextArr.filter((k) => !baseSet.has(k));
  if (eqJson([...kept, ...added], nextArr)) return { add: added, remove: removed };
  return { set: nextArr };
}

export function diffRoadmap(base, next) {
  const diff = {};

  const positions = {};
  for (const [k, v] of Object.entries(next.positions || {})) {
    const np = normPos(v);
    if (!base.positions[k] || !eqJson(normPos(base.positions[k]), np)) positions[k] = np;
  }
  for (const k of Object.keys(base.positions)) if (!(k in (next.positions || {}))) positions[k] = null;
  if (Object.keys(positions).length) diff.positions = positions;

  const baseCustom = new Map(base.customEpics.map((e) => [e.key, pickEpic(e)]));
  const nextCustom = new Map((next.customEpics || []).map((e) => [e.key, pickEpic(e)]));
  const upsert = [];
  for (const [k, e] of nextCustom) if (!baseCustom.has(k) || !eqJson(baseCustom.get(k), e)) upsert.push(e);
  const remove = [...baseCustom.keys()].filter((k) => !nextCustom.has(k));
  if (upsert.length || remove.length) diff.customEpics = { upsert, remove };

  for (const name of ["prioOrder", "filaProdutoOrder", "filaUxOrder"]) {
    const op = orderOp(base[name] || [], next[name] || []);
    if (op) diff[name] = op;
  }
  return diff;
}

export const isEmptyDiff = (d) => Object.keys(d).length === 0;

export function summarizeRoadmap(state) {
  return {
    positions: Object.keys(state.positions || {}).length,
    scheduled: Object.values(state.positions || {}).filter((p) => p && p.roadmapLane).length,
    customEpics: (state.customEpics || []).length,
  };
}
