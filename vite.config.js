import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { authApiPlugin } from "./src/server/auth-api.js";
import { initiativesApiPlugin } from "./src/server/initiatives-api.js";
import { roadmapApiPlugin } from "./src/server/roadmap-api.js";
import { jiraApiPlugin } from "./src/server/jira-api.js";
import { planningApiPlugin } from "./src/server/planning-api.js";
import { workspacesApiPlugin } from "./src/server/workspaces-api.js";

export default defineConfig(({ mode }) => {
  // Prefixo "" carrega TODAS as variáveis do .env.local para este arquivo, que
  // roda no Node. Só as `VITE_*` chegam ao bundle — por isso JWT_SECRET,
  // N8N_BASE_URL, JIRA_API_TOKEN e as credenciais do KV, lidas
  // aqui e passadas aos plugins, nunca vão para o browser.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), authApiPlugin(env), initiativesApiPlugin(env), roadmapApiPlugin(env), jiraApiPlugin(env), planningApiPlugin(env), workspacesApiPlugin(env)],
  };
});
