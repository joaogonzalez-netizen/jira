import { handleLogout } from "../../src/server/auth-core.js";
import { isSecure, sendJson } from "../_lib/respond.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, { status: 405, body: { message: "Método não permitido" } });
  }
  // Limpar cookie não depende de configuração: mesmo com o auth mal configurado,
  // sair tem de funcionar.
  return sendJson(res, handleLogout(isSecure(req)));
}
