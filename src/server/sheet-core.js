/**
 * Sincronização da planilha "[Dados] Jira 2" via conta de serviço do Google —
 * substitui o Apps Script Web App (apps-script/sync.gs.js), que dependia de uma
 * implantação manual e de expor a planilha como "Anyone" na internet.
 *
 * Roda em dois lugares e por isso não conhece nem `req` nem `res`, igual ao
 * auth-core.js: o plugin do Vite (`sheet-api.js`, dev e preview) e a função da
 * Vercel (`api/sheet/sync.js`, produção).
 *
 * A planilha precisa compartilhar acesso de leitura com o `client_email` da
 * conta de serviço (Compartilhar → colar o e-mail, papel Leitor).
 */
import { SignJWT, importPKCS8 } from "jose";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
// Mesma planilha hardcoded em apps-script/sync.gs.js; dá pra sobrescrever via env.
const DEFAULT_SHEET_ID = "1HteBrBkY4XCkmXGMTJIuA2EXAraZsDKw_xjZu0xoUgw";

export function loadSheetConfig(env) {
  const raw = String(env.GOOGLE_SERVICE_ACCOUNT_JSON || "");
  const missing = [];
  if (!raw) missing.push("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (missing.length) return { missing };

  let account;
  try {
    account = JSON.parse(raw);
  } catch (e) {
    return { missing: ["GOOGLE_SERVICE_ACCOUNT_JSON (não é um JSON válido)"] };
  }
  if (!account.client_email || !account.private_key) {
    return { missing: ["GOOGLE_SERVICE_ACCOUNT_JSON (sem client_email ou private_key)"] };
  }

  return {
    missing: [],
    sheetId: String(env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID),
    clientEmail: account.client_email,
    privateKey: account.private_key,
  };
}

export function configError(config) {
  if (!config.missing?.length) return null;
  return {
    status: 503,
    body: { message: `Sincronização não configurada: defina ${config.missing.join(" e ")}` },
  };
}

async function getAccessToken(config) {
  const key = await importPKCS8(config.privateKey, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(config.clientEmail)
    .setSubject(config.clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.access_token !== "string") {
    throw new Error(data.error_description || data.error || "Falha ao autenticar a conta de serviço do Google");
  }
  return data.access_token;
}

// Mesma forma que o Apps Script devolvia: um objeto por linha, chaveado pelo
// cabeçalho, só linhas com "Key" preenchida.
function rowsFromValues(values) {
  if (!Array.isArray(values) || !values.length) return [];
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const raw = values[i];
    const row = {};
    headers.forEach((h, j) => { row[h] = raw[j] ?? ""; });
    if (row["Key"]) rows.push(row);
  }
  return rows;
}

export async function fetchSheetRows(config) {
  const token = await getAccessToken(config);
  const authHeader = { Authorization: `Bearer ${token}` };

  const metaRes = await fetch(`${SHEETS_API}/${config.sheetId}?fields=sheets.properties.title`, { headers: authHeader });
  const meta = await metaRes.json().catch(() => ({}));
  if (!metaRes.ok) throw new Error(meta.error?.message || "Falha ao ler metadados da planilha");
  const sheetTitle = meta.sheets?.[0]?.properties?.title;
  if (!sheetTitle) throw new Error("A planilha não tem nenhuma aba");

  const valuesRes = await fetch(
    `${SHEETS_API}/${config.sheetId}/values/${encodeURIComponent(sheetTitle)}?valueRenderOption=FORMATTED_VALUE`,
    { headers: authHeader }
  );
  const body = await valuesRes.json().catch(() => ({}));
  if (!valuesRes.ok) throw new Error(body.error?.message || "Falha ao ler os dados da planilha");

  return rowsFromValues(body.values);
}

export async function handleSync(config) {
  const rows = await fetchSheetRows(config);
  return { status: 200, body: rows };
}
