/**
 * Lista de workspaces (projetos) e a identidade de cada um: nome, sigla e cor.
 * Guardada em `jira:workspaces`, fora de qualquer prefixo. O padrão (STLFLIX)
 * existe sempre, mesmo sem registro; se o super editar nome/cor dele, o
 * registro guarda só a identidade — os dados continuam nas chaves de sempre.
 *
 * Leitura: qualquer sessão válida. Criar e editar: só o superusuário.
 * Roda no plugin do Vite (`workspaces-api.js`) e na função da Vercel
 * (`api/workspaces.js`).
 */
import { loadConfig as loadInitiativesConfig, resolveSessionFromCookie } from "./initiatives-core.js";
import { handleSeed } from "./roadmap-core.js";
import { DEFAULT_WS, REGISTRY_KEY, WS_ID_RE, baseReady, configForWorkspace, readRegistry } from "./workspace.js";

export { resolveSessionFromCookie };

export const WS_COLORS = ["#5166e6", "#00955a", "#ad54ff", "#f54300", "#e5484d", "#0f9fa8", "#c28a00", "#d6409f", "#8b8b8d"];
const DEFAULT_IDENTITY = { id: DEFAULT_WS, name: "STLFLIX", initials: "S", color: "#00955a" };

export function loadConfig(env) {
  return loadInitiativesConfig(env);
}

export function configError(config) {
  if (!config.missing.length) return null;
  return { status: 503, body: { message: `Projetos indisponíveis: defina ${config.missing.join(" e ")} (Redis, Vercel Storage)` } };
}

const isSuper = (session) => !!session && session.role === "super";
const forbidden = () => ({ status: 403, body: { message: "Só o superusuário cria e edita projetos" } });

function initialsOf(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] || "") + (words[1]?.[0] || "")).toUpperCase() || "P";
}

/** Nome, sigla (até 3 letras) e cor da paleta; o que vier inválido é ignorado. */
export function applyIdentity(base, input) {
  const next = { ...base };
  if (typeof input.name === "string" && input.name.trim()) next.name = input.name.trim().slice(0, 60);
  if (typeof input.initials === "string" && input.initials.trim()) next.initials = input.initials.trim().slice(0, 3);
  if (typeof input.color === "string" && WS_COLORS.includes(input.color)) next.color = input.color;
  return next;
}

export function slugify(name) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 28) || "projeto";
}

async function writeRegistry(config, list) {
  await baseReady(config.kv);
  await config.kv.set(REGISTRY_KEY, JSON.stringify(list));
}

/** Lista para o seletor: o padrão primeiro (com a identidade editada, se houver). */
export async function handleList(session, config) {
  if (!session) return { status: 401, body: { message: "Entre para ver os projetos" } };
  const registry = await readRegistry(config.kv);
  const def = { ...DEFAULT_IDENTITY, ...(registry.find((w) => w.id === DEFAULT_WS) || {}) };
  return { status: 200, body: [def, ...registry.filter((w) => w.id !== DEFAULT_WS)] };
}

export async function handleCreate(input, session, config) {
  if (!isSuper(session)) return forbidden();
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) return { status: 400, body: { message: "Dê um nome ao projeto" } };

  const registry = await readRegistry(config.kv);
  const id = `${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`;
  if (!WS_ID_RE.test(id)) return { status: 400, body: { message: "Nome inválido" } };
  const ws = applyIdentity(
    { id, name, initials: initialsOf(name), color: WS_COLORS[registry.length % WS_COLORS.length], createdBy: session.user.email || null, createdAt: new Date().toISOString() },
    input,
  );
  await writeRegistry(config, [...registry, ws]);
  // Roadmap vazio no servidor: sem isso o projeto novo abriria pedindo a
  // migração "do navegador para o servidor", que não faz sentido aqui.
  await handleSeed({ state: {} }, session, configForWorkspace(config, id));
  return { status: 201, body: ws };
}

export async function handleUpdate(id, input, session, config) {
  if (!isSuper(session)) return forbidden();
  if (typeof id !== "string" || !(id === DEFAULT_WS || WS_ID_RE.test(id))) return { status: 400, body: { message: "id inválido" } };
  const registry = await readRegistry(config.kv);
  const idx = registry.findIndex((w) => w.id === id);
  if (idx === -1 && id !== DEFAULT_WS) return { status: 404, body: { message: "Projeto não encontrado" } };
  const current = idx === -1 ? { ...DEFAULT_IDENTITY } : registry[idx];
  const next = applyIdentity(current, input);
  await writeRegistry(config, idx === -1 ? [...registry, next] : registry.map((w, i) => (i === idx ? next : w)));
  return { status: 200, body: next };
}
