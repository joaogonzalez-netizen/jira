/**
 * Adaptador das funções da Vercel para o auth (produção).
 *
 * A lógica é a mesma do dev: `src/server/auth-core.js`. O que muda aqui é só o
 * ambiente — `process.env` em vez do `loadEnv` do Vite, e o request já vem com
 * o corpo parseado.
 *
 * As três variáveis (N8N_BASE_URL, JWT_SECRET, PLATFORM_PROJECT_SLUG) vivem em
 * Project Settings → Environment Variables. Sem prefixo VITE_ nenhuma delas
 * chega ao bundle do browser; aqui elas são lidas no servidor, por request.
 */
import { loadConfig } from "../../src/server/auth-core.js";

export const config = loadConfig(process.env);

export function sendJson(res, result) {
  if (result.cookie) res.setHeader("Set-Cookie", result.cookie);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(result.status).send(JSON.stringify(result.body));
}

/** https é a regra na Vercel; ler o header em vez de assumir mantém a função
    honesta se ela for servida por outro proxy. */
export function isSecure(req) {
  return req.headers["x-forwarded-proto"] !== "http";
}

/** O corpo já vem parseado quando o Content-Type é JSON, mas um cliente que
    esqueça o header entrega string — aí o parse é nosso. */
export function jsonBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === "object") return body;
  try {
    const parsed = JSON.parse(String(body));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}
