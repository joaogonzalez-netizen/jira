import { AUTH_COOKIE, configError, handleMe, readCookie } from "../../src/server/auth-core.js";
import { config, sendJson } from "../_lib/respond.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
  }
  const misconfigured = configError(config);
  if (misconfigured) return sendJson(res, misconfigured);

  try {
    const token = readCookie(req.headers.cookie, AUTH_COOKIE);
    return sendJson(res, await handleMe(token, config));
  } catch (e) {
    console.error("[auth/me]", e);
    return sendJson(res, { status: 500, body: { message: "Erro interno" } });
  }
}
