import { test } from "node:test";
import assert from "node:assert/strict";
import { diffRoadmap, isEmptyDiff } from "./roadmap-store.js";
import { applyDiff } from "../server/roadmap-core.js";

const SUPER = { role: "super", user: { id: "1", email: "joao@x.com" } };
const baseDoc = (s) => ({ v: 1, rev: 1, updatedAt: null, updatedBy: null, ...s });
const pos = (lane, startWeek, durationWeeks = 2) => ({ roadmapLane: lane, startWeek, durationWeeks });
const epic = (key, createdBy, summary = "x") => ({ key, project: null, summary, assignee: null, reporter: null, status: "Rascunho", tipo: null, created: null, priority: null, epic: true, createdBy });
const EMPTY = { positions: {}, customEpics: [], prioOrder: [], filaProdutoOrder: [], filaUxOrder: [] };

test("estados iguais não geram diff (nem por ordem de chaves nem por campos ausentes)", () => {
  const s = { ...EMPTY, positions: { A: { durationWeeks: 2, startWeek: 1, roadmapLane: "STL IA" } }, customEpics: [epic("NOVO-1", "a@x.com")] };
  const same = { ...EMPTY, positions: { A: pos("STL IA", 1) }, customEpics: [{ ...epic("NOVO-1", "a@x.com"), extra: "ignorado" }] };
  assert.ok(isEmptyDiff(diffRoadmap(s, same)));
});

test("posição sem durationWeeks recebe o padrão 2 (soltar card sem posição prévia)", () => {
  const d = diffRoadmap(EMPTY, { ...EMPTY, positions: { A: { roadmapLane: null, startWeek: null } } });
  assert.deepEqual(d.positions.A, { roadmapLane: null, startWeek: null, durationWeeks: 2 });
});

test("só o que mudou vai no diff", () => {
  const base = { ...EMPTY, positions: { A: pos("STL IA", 1), B: pos("STLFLIX", 2), C: pos(null, null) } };
  const next = { ...EMPTY, positions: { A: pos("STL IA", 1), B: pos("STLFLIX", 5) } };
  assert.deepEqual(diffRoadmap(base, next), { positions: { B: pos("STLFLIX", 5), C: null } });
});

test("filas: entrar no fim e sair viram add/remove; reordenar vira set", () => {
  const base = { ...EMPTY, filaProdutoOrder: ["A", "B", "C"] };
  assert.deepEqual(diffRoadmap(base, { ...base, filaProdutoOrder: ["A", "B", "C", "D"] }).filaProdutoOrder, { add: ["D"], remove: [] });
  assert.deepEqual(diffRoadmap(base, { ...base, filaProdutoOrder: ["A", "C"] }).filaProdutoOrder, { add: [], remove: ["B"] });
  assert.deepEqual(diffRoadmap(base, { ...base, filaProdutoOrder: ["B", "C", "D"] }).filaProdutoOrder, { add: ["D"], remove: ["A"] });
  assert.deepEqual(diffRoadmap(base, { ...base, filaProdutoOrder: ["C", "A", "B"] }).filaProdutoOrder, { set: ["C", "A", "B"] });
  assert.deepEqual(diffRoadmap(base, { ...base, filaProdutoOrder: ["A", "X", "B", "C"] }).filaProdutoOrder, { set: ["A", "X", "B", "C"] });
});

// Ida e volta: aplicar o diff no servidor tem que reproduzir exatamente o estado local.
test("round-trip aleatório: applyDiff(base, diff(base, next)) === next", () => {
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const lanes = ["STLFLIX", "STL IA", "STL Seller", "STL Loja", "Backoffice", "STL Academy", null];
  const sheetKeys = Array.from({ length: 25 }, (_, i) => `SELLER-${i + 1}`);
  const shuffle = (a) => a.map((v) => [rnd(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const randPos = () => { const lane = pick(lanes); return lane ? pos(lane, Math.floor(rnd() * 20) - 4, 1 + Math.floor(rnd() * 6)) : pos(null, null, 1 + Math.floor(rnd() * 6)); };

  for (let iter = 0; iter < 400; iter++) {
    const base = JSON.parse(JSON.stringify(EMPTY));
    sheetKeys.forEach((k) => { if (rnd() < 0.6) base.positions[k] = randPos(); });
    for (let i = 0; i < 6; i++) {
      const k = `NOVO-${100 + i}`;
      base.customEpics.push(epic(k, pick(["a@x.com", "b@x.com"]), `n${i}`));
      base.positions[k] = randPos();
    }
    const pool = [...sheetKeys, ...base.customEpics.map((e) => e.key)];
    base.prioOrder = shuffle(pool).slice(0, 8);
    base.filaProdutoOrder = shuffle(pool).slice(0, 6);
    base.filaUxOrder = shuffle(pool).slice(0, 4);

    const next = JSON.parse(JSON.stringify(base));
    for (let m = 0; m < 1 + Math.floor(rnd() * 6); m++) {
      const op = Math.floor(rnd() * 9);
      if (op === 0) next.positions[pick(sheetKeys)] = randPos();
      else if (op === 1) delete next.positions[pick(Object.keys(next.positions))];
      else if (op === 2) { const k = `NOVO-${300 + Math.floor(rnd() * 50)}`; if (!next.customEpics.some((e) => e.key === k)) { next.customEpics.push(epic(k, "a@x.com", "novo")); next.positions[k] = randPos(); } }
      else if (op === 3 && next.customEpics.length) { const e = pick(next.customEpics); e.summary = `renomeado ${Math.floor(rnd() * 99)}`; }
      else if (op === 4 && next.customEpics.length) { const e = pick(next.customEpics); next.customEpics = next.customEpics.filter((x) => x.key !== e.key); delete next.positions[e.key]; }
      else if (op === 5) { const name = pick(["prioOrder", "filaProdutoOrder", "filaUxOrder"]); const k = pick(pool); if (!next[name].includes(k)) next[name].push(k); }
      else if (op === 6) { const name = pick(["prioOrder", "filaProdutoOrder", "filaUxOrder"]); if (next[name].length) next[name] = next[name].filter((k) => k !== pick(next[name])); }
      else if (op === 7) { const name = pick(["prioOrder", "filaProdutoOrder", "filaUxOrder"]); next[name] = shuffle(next[name]); }
      else { const name = pick(["prioOrder", "filaProdutoOrder", "filaUxOrder"]); const k = pick(pool); const arr = next[name].filter((x) => x !== k); arr.splice(Math.floor(rnd() * (arr.length + 1)), 0, k); next[name] = arr; }
    }

    const diff = diffRoadmap(base, next);
    const res = applyDiff(baseDoc(base), diff, SUPER);
    assert.ok(!res.error, `iter ${iter}: ${JSON.stringify(res.error)}\n${JSON.stringify(diff)}`);
    const got = res.doc;
    const norm = (p) => ({ roadmapLane: p.roadmapLane ?? null, startWeek: p.startWeek ?? null, durationWeeks: p.durationWeeks ?? 2 });
    const expectedPositions = Object.fromEntries(Object.entries(next.positions).map(([k, v]) => [k, norm(v)]));
    assert.deepEqual(got.positions, expectedPositions, `iter ${iter} positions`);
    const byKey = (list) => Object.fromEntries(list.map((e) => [e.key, { key: e.key, summary: e.summary, createdBy: e.createdBy }]));
    assert.deepEqual(byKey(got.customEpics), byKey(next.customEpics), `iter ${iter} customEpics`);
    for (const name of ["prioOrder", "filaProdutoOrder", "filaUxOrder"]) assert.deepEqual(got[name], next[name], `iter ${iter} ${name}`);
    // estado idêntico => diff vazio e revisão preservada
    if (isEmptyDiff(diff)) assert.equal(res.changed, false);
  }
});

import { applyEpicOverrides, mergeCustomEpics } from "./roadmap-store.js";

test("applyEpicOverrides: renomeia e esconde só o que o servidor registrou; sem overrides devolve a mesma lista", () => {
  const eps = [{ key: "A-1", summary: "Velho" }, { key: "A-2", summary: "Fica" }, { key: "A-3", summary: "Some" }];
  assert.equal(applyEpicOverrides(eps, {}), eps);
  assert.equal(applyEpicOverrides(eps, undefined), eps);
  const out = applyEpicOverrides(eps, { "A-1": { summary: "Novo" }, "A-3": { removed: true }, "Z-9": { removed: true } });
  assert.deepEqual(out.map((e) => [e.key, e.summary]), [["A-1", "Novo"], ["A-2", "Fica"]]);
  assert.equal(eps[0].summary, "Velho", "não muta a lista original");
  // override igual ao que a planilha já traz: devolve o próprio objeto (sem re-render à toa)
  assert.equal(applyEpicOverrides(eps, { "A-2": { summary: "Fica" } })[1], eps[1]);
});

test("mergeCustomEpics: rascunhos entram; criado no Jira + já na planilha não duplica e mantém o dono", () => {
  const sheet = [{ key: "SELLER-1", summary: "da planilha" }, { key: "SELLER-301", summary: "criado aqui, já sincronizado" }];
  const custom = [
    { key: "NOVO-1", summary: "rascunho", createdBy: "a@x.com" },
    { key: "SELLER-301", summary: "versão local", createdBy: "andre@x.com" },
    { key: "SELLER-302", summary: "criado aqui, planilha ainda não viu", createdBy: "joao@x.com" },
  ];
  const out = mergeCustomEpics(sheet, custom);
  assert.deepEqual(out.map((e) => e.key), ["SELLER-1", "SELLER-301", "NOVO-1", "SELLER-302"]);
  const dup = out.find((e) => e.key === "SELLER-301");
  assert.equal(dup.summary, "criado aqui, já sincronizado", "vale a versão da planilha");
  assert.equal(dup.createdBy, "andre@x.com", "o dono segue valendo");
  assert.equal(out.filter((e) => e.key === "SELLER-301").length, 1);
  assert.equal(out.find((e) => e.key === "SELLER-1").createdBy, undefined, "épico da planilha continua sem dono");
});
