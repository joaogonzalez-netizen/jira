import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { authApiPlugin } from "./src/server/auth-api.js";
import { sheetApiPlugin } from "./src/server/sheet-api.js";

export default defineConfig(({ mode }) => ({
  // Prefixo "" carrega TODAS as variáveis do .env.local para este arquivo, que
  // roda no Node. Só as `VITE_*` chegam ao bundle — por isso JWT_SECRET,
  // N8N_BASE_URL e GOOGLE_SERVICE_ACCOUNT_JSON, lidos aqui e passados aos
  // plugins, nunca vão para o browser.
  plugins: [react(), authApiPlugin(loadEnv(mode, process.cwd(), "")), sheetApiPlugin(loadEnv(mode, process.cwd(), ""))],
}));
