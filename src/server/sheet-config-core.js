/**
 * Qual planilha o sync lê — configurável na UI (Configurações), em vez de só
 * por variável de ambiente (`GOOGLE_SHEET_ID`), pra dar pra trocar/reusar
 * este board em outro desenvolvimento sem precisar de redeploy.
 *
 * Persistido no mesmo Redis das iniciativas (`REDIS_URL`), sob uma chave
 * própria. Roda nos dois lugares de sempre: o plugin do Vite
 * (`sheet-config-api.js`) e a função da Vercel (`api/sheet/config.js`).
 *
 * Ler e gravar exigem sessão com papel `admin` ou `super` (o ID da planilha
 * não é segredo, mas não há motivo pra expô-lo a anônimos). O sync lê o
 * override direto do Redis, sem sessão.
 */
import { createClient } from "redis";
import { loadConfig as loadAuthConfig, readCookie, resolveSession, AUTH_COOKIE } from "./auth-core.js";

const KV_KEY = "jira:sheet-config";

export function loadConfig(env, injectedKv) {
  const authConfig = loadAuthConfig(env);
  if (injectedKv) {
    return { missing: [], kv: injectedKv, kvReady: Promise.resolve(), authConfig, serviceAccountEmail: readServiceAccountEmail(env) };
  }

  const url = String(env.REDIS_URL || "");
  const missing = [];
  if (!url) missing.push("REDIS_URL");
  if (missing.length) return { missing };

  const client = createClient({ url });
  client.on("error", (err) => console.error("[sheet-config] erro de conexão com o Redis:", err));
  return { missing: [], kv: client, kvReady: null, authConfig, serviceAccountEmail: readServiceAccountEmail(env) };
}

function readServiceAccountEmail(env) {
  try {
    const account = JSON.parse(String(env.GOOGLE_SERVICE_ACCOUNT_JSON || ""));
    return account.client_email || null;
  } catch {
    return null;
  }
}

export function configError(config) {
  if (!config.missing?.length) return null;
  return {
    status: 503,
    body: { message: `Configuração de planilha indisponível: defina ${config.missing.join(" e ")} (Redis, Vercel Storage)` },
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

function canWrite(session) {
  return !!session && (session.role === "admin" || session.role === "super");
}

function forbidden(message = "Sem permissão para alterar a planilha de dados") {
  return { status: 403, body: { message } };
}

/** Aceita tanto o ID puro quanto um link completo do Google Sheets colado
    (.../spreadsheets/d/<ID>/edit...). */
export function extractSheetId(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  const m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : raw;
}

/** `null` quando não há override salvo (ou Redis não configurado) — quem
    chama cai de volta pro `GOOGLE_SHEET_ID`/padrão de `sheet-core.js`.
    Falha de leitura NÃO vira `null`: propaga, pra o sync recusar em vez de
    puxar a planilha errada e publicá-la pra todo mundo. */
export async function readSheetIdOverride(config) {
  if (config.missing?.length) return null;
  const client = await ensureConnected(config);
  const raw = await client.get(KV_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return typeof parsed?.sheetId === "string" && parsed.sheetId ? parsed.sheetId : null;
}

/** Só quem pode alterar enxerga a configuração (ID da planilha). */
export async function handleGet(config, session) {
  if (!canWrite(session)) return forbidden("Sem permissão para ver a planilha de dados");
  const sheetId = await readSheetIdOverride(config);
  return { status: 200, body: { sheetId, serviceAccountEmail: config.serviceAccountEmail || null } };
}

export async function handleSet(input, session, config) {
  if (!canWrite(session)) return forbidden();
  const sheetId = extractSheetId(input?.sheetId);
  if (!sheetId) return { status: 400, body: { message: "Informe o ID ou o link da planilha" } };

  const client = await ensureConnected(config);
  await client.set(KV_KEY, JSON.stringify({ sheetId, updatedAt: new Date().toISOString(), updatedBy: session.user.email || null }));
  return { status: 200, body: { sheetId } };
}
