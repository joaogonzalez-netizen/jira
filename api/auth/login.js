import { configError, handleLogin } from "../../src/server/auth-core.js";
import { config, isSecure, jsonBody, sendJson } from "../_lib/respond.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
  }
  const misconfigured = configError(config);
  if (misconfigured) return sendJson(res, misconfigured);

  try {
    return sendJson(res, await handleLogin(jsonBody(req), config, isSecure(req)));
  } catch (e) {
    console.error("[auth/login]", e);
    return sendJson(res, { status: 500, body: { message: "Erro interno" } });
  }
}
