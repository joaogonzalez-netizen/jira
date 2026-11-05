import { test } from "node:test";
import assert from "node:assert/strict";
import { filterRowsByProject, handleWorkspaceSync } from "./sheet-core.js";

const ROWS = [
  { Key: "AUT-1", Project: "Automação" },
  { Key: "DAD-1", Project: "Dados" },
  { Key: "CUS-1", Project: "Custom" },
  { Key: "FLIX-1", Project: "STLFLIX" },
];
const fetchRows = async () => ROWS;

test("filtro de projeto ignora acento e caixa", () => {
  assert.deepEqual(filterRowsByProject(ROWS, ["Automações", "automacao", "DADOS"]).map((r) => r.Key), ["AUT-1", "DAD-1"]);
});

test("STLFLIX (padrão) recebe a planilha inteira", async () => {
  const r = await handleWorkspaceSync(fetchRows, null, null);
  assert.equal(r.body.length, 4);
});

test("projeto com projetos do Jira usa a planilha padrão filtrada", async () => {
  const r = await handleWorkspaceSync(fetchRows, null, { id: "custom-x", jiraProjects: ["Custom"] });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.map((x) => x.Key), ["CUS-1"]);
});

test("projeto sem filtro e sem planilha própria é recusado", async () => {
  const r = await handleWorkspaceSync(fetchRows, null, { id: "vazio-x" });
  assert.equal(r.status, 409);
  const own = await handleWorkspaceSync(fetchRows, "outra-planilha", { id: "vazio-x" });
  assert.equal(own.status, 200);
});
