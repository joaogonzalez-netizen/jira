import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// O plano da Vercel aceita no máximo 12 funções: com 13 o deploy falha inteiro
// (aconteceu com api/jira/issue-types.js). Rota nova entra numa função que já existe.
const MAX_FUNCTIONS = 12;

function functionFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name.startsWith("_") ? [] : functionFiles(p);
    return /\.(js|mjs|ts)$/.test(d.name) && !d.name.startsWith("_") ? [p] : [];
  });
}

test(`no máximo ${MAX_FUNCTIONS} funções em api/ (limite do plano da Vercel)`, () => {
  const files = functionFiles(new URL("../../api", import.meta.url).pathname);
  assert.ok(files.length <= MAX_FUNCTIONS, `${files.length} funções: ${files.map((f) => path.relative(process.cwd(), f)).join(", ")}`);
});
