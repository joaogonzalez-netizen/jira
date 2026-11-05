// Local mock mode: the app with example data and a test login, no production
// access. Starts an in-memory Redis, a one-click login page and Vite with a
// local-only JWT secret (tokens minted here are useless anywhere else).
//
//   npm run dev:mock  →  open http://localhost:5175 once to sign in
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { SignJWT } from "jose";
import { startFakeRedis } from "./fake-redis.mjs";
import { buildSeed, sheetRows } from "./seed.mjs";

const APP_PORT = 5174;
const LOGIN_PORT = 5175;
const REDIS_PORT = 6390;
const SECRET = "local-mock-only-secret";

await startFakeRedis(REDIS_PORT, buildSeed());
// "Atualizar" reads these rows instead of the Google Sheet.
const rowsFile = path.join(os.tmpdir(), "fila-dev-mock-sheet.json");
fs.writeFileSync(rowsFile, JSON.stringify(sheetRows()));

const token = await new SignJWT({ email: "mock@local.test", name: "Teste Local", is_super: true })
  .setProtectedHeader({ alg: "HS256" })
  .setSubject("mock")
  .setExpirationTime("30d")
  .sign(new TextEncoder().encode(SECRET));

// Cookies ignore the port: a cookie set here also reaches the app on APP_PORT.
http.createServer((req, res) => {
  res.writeHead(302, {
    "Set-Cookie": `auth_token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 3600}`,
    Location: `http://localhost:${APP_PORT}/`,
  });
  res.end();
}).listen(LOGIN_PORT, "127.0.0.1");

const vite = spawn("npx", ["vite", "--port", String(APP_PORT), "--strictPort"], {
  stdio: "inherit",
  env: { ...process.env, REDIS_URL: `redis://127.0.0.1:${REDIS_PORT}`, JWT_SECRET: SECRET, MOCK_SHEET_ROWS: rowsFile },
});
console.log(`\n  Mock mode: open http://localhost:${LOGIN_PORT} to sign in as "Teste Local"\n`);

// Example workspaces with only the Execução menus, created through the real API.
const WORKSPACES = [
  { name: "Custom", initials: "C", color: "#0f9fa8", jiraProjects: ["Custom"], modules: ["execucao"] },
  { name: "ProductOps", initials: "PO", color: "#c28a00", jiraProjects: ["Automação", "Dados"], modules: ["execucao"] },
];
const api = (method, body) => fetch(`http://localhost:${APP_PORT}/api/workspaces`, {
  method, headers: { Cookie: `auth_token=${token}`, "Content-Type": "application/json" }, body: body && JSON.stringify(body),
});
for (let i = 0; i < 60; i++) {
  const res = await api("GET").catch(() => null);
  if (res && res.ok) {
    for (const ws of WORKSPACES) await api("POST", ws);
    break;
  }
  await new Promise((r) => setTimeout(r, 500));
}
vite.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => vite.kill(sig));
