import { test } from "node:test";
import assert from "node:assert/strict";
import { HEADER_TITLE, cleanHeader, headerNodes, withHeader } from "./epic-header.js";

const FULL = {
  objective: { name: "Reduzir cancelamento", period: "16/10/26 → 15/01/27" },
  keyResult: { name: "Churn de 6% para 4%", metric: "5,2% / 4%", due: "15/01/2027" },
  opportunity: { name: "Usuário não acha o que baixar", description: "Dor.\n\nEvidência em 3 entrevistas.", links: [{ label: "Estudo", url: "https://example.com/estudo" }, { label: "Ruim", url: "javascript:alert(1)" }] },
  solution: { name: "Busca por imagem", description: "Sobe uma foto e acha o modelo." },
  experiments: [{ name: "Fake door", hypothesis: "10% clicam", status: "Concluído", outcome: "Validado" }],
  appUrl: "https://app.example.com",
};

const textOf = (node) => JSON.stringify(node);

test("cleanHeader: aceita o cabeçalho completo e aparas os textos", () => {
  const r = cleanHeader({ ...FULL, objective: { name: "  Reduzir cancelamento  ", period: "x" } });
  assert.equal(r.ok, true);
  assert.equal(r.header.objective.name, "Reduzir cancelamento");
  assert.equal(r.header.experiments.length, 1);
  assert.equal(r.header.appUrl, "https://app.example.com");
});

test("cleanHeader: só links http(s) passam e o rótulo cai para a URL", () => {
  const r = cleanHeader({ ...FULL, opportunity: { name: "O", links: [{ label: "", url: "https://a.com/x" }, { label: "mal", url: "javascript:alert(1)" }, { label: "data", url: "data:text/html,x" }, { url: "ftp://a.com" }] } });
  assert.deepEqual(r.header.opportunity.links, [{ label: "https://a.com/x", url: "https://a.com/x" }]);
  assert.equal(cleanHeader({ ...FULL, appUrl: "javascript:alert(1)" }).header.appUrl, null);
});

test("cleanHeader: limites de tamanho e de quantidade", () => {
  const big = cleanHeader({ ...FULL, opportunity: { name: "x".repeat(500), description: "y".repeat(5000), links: Array.from({ length: 30 }, (_, i) => ({ label: `l${i}`, url: `https://a.com/${i}` })) }, experiments: Array.from({ length: 30 }, (_, i) => ({ name: `E${i}` })) });
  assert.equal(big.header.opportunity.name.length, 200);
  assert.equal(big.header.opportunity.description.length, 2000);
  assert.equal(big.header.opportunity.links.length, 10);
  assert.equal(big.header.experiments.length, 10);
});

test("cleanHeader: recusa o que não é objeto e o que não tem nada para mostrar", () => {
  for (const bad of [null, undefined, "x", 5, [], {}, { objective: { name: "  " } }, { experiments: [{ hypothesis: "sem nome" }] }]) assert.equal(cleanHeader(bad).ok, false, JSON.stringify(bad));
});

test("headerNodes: título, rótulos, links, experimentos e a linha que fecha o bloco", () => {
  const nodes = headerNodes(cleanHeader(FULL).header);
  assert.equal(nodes[0].type, "heading");
  assert.equal(nodes[0].content[0].text, HEADER_TITLE);
  assert.equal(nodes[nodes.length - 1].type, "rule");
  const json = textOf(nodes);
  for (const piece of ["Objetivo: ", "Reduzir cancelamento (16/10/26 → 15/01/27)", "Key Result: ", "prazo 15/01/2027", "Oportunidade: ", "Evidência em 3 entrevistas.", "Links: ", "https://example.com/estudo", "Solução: ", "Busca por imagem", "Experimentos:", "Fake door — 10% clicam (Concluído · Validado)", "Abrir no STL Roadmap"]) {
    assert.ok(json.includes(piece), piece);
  }
  assert.ok(!json.includes("javascript:"));
  // parágrafos em branco viram parágrafos separados
  assert.equal(nodes.filter((n) => n.type === "paragraph" && textOf(n).includes("Dor.")).length, 1);
});

test("headerNodes: só o que existe aparece", () => {
  const nodes = headerNodes(cleanHeader({ keyResult: { name: "Só o KR" } }).header);
  assert.equal(nodes.length, 3); // título, KR, linha
  assert.ok(!textOf(nodes).includes("Oportunidade"));
});

const para = (t) => ({ type: "paragraph", content: [{ type: "text", text: t }] });

test("withHeader: sem descrição nenhuma, vira só o cabeçalho", () => {
  const nodes = headerNodes(cleanHeader(FULL).header);
  for (const empty of [null, undefined, "", { foo: 1 }, { type: "doc", content: "x" }]) {
    const doc = withHeader(empty, nodes);
    assert.equal(doc.type, "doc");
    assert.equal(doc.version, 1);
    assert.deepEqual(doc.content, nodes);
  }
});

test("withHeader: descrição sem cabeçalho ganha o bloco no topo e o texto continua", () => {
  const nodes = headerNodes(cleanHeader(FULL).header);
  const doc = withHeader({ type: "doc", version: 1, content: [para("Texto do time")] }, nodes);
  assert.deepEqual(doc.content.slice(-1), [para("Texto do time")]);
  assert.equal(doc.content[0].type, "heading");
});

test("withHeader: troca só o bloco antigo, preservando o que veio antes e depois dele", () => {
  const old = headerNodes(cleanHeader({ keyResult: { name: "KR velho" } }).header);
  const next = headerNodes(cleanHeader({ keyResult: { name: "KR novo" } }).header);
  const doc = withHeader({ type: "doc", version: 1, content: [...old, para("Escopo do épico"), para("Critérios")] }, next);
  const json = JSON.stringify(doc);
  assert.ok(json.includes("KR novo"));
  assert.ok(!json.includes("KR velho"));
  assert.equal(doc.content.filter((n) => n.type === "heading").length, 1);
  assert.deepEqual(doc.content.slice(-2), [para("Escopo do épico"), para("Critérios")]);
  // idempotente: aplicar o mesmo cabeçalho de novo não muda nada
  assert.deepEqual(withHeader(doc, next), doc);
});

test("withHeader: bloco antigo sem a linha de fechamento não apaga nada do resto", () => {
  const next = headerNodes(cleanHeader({ keyResult: { name: "KR novo" } }).header);
  const broken = { type: "doc", version: 1, content: [{ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: HEADER_TITLE }] }, para("texto do time que não pode sumir")] };
  const doc = withHeader(broken, next);
  assert.ok(JSON.stringify(doc).includes("texto do time que não pode sumir"));
  assert.ok(JSON.stringify(doc).includes("KR novo"));
});
