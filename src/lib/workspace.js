/**
 * Projeto (workspace) ativo no navegador. Vai no cookie `pp-ws`, que o
 * navegador manda em todo request — o servidor lê de lá e escolhe as chaves do
 * Redis (ver src/server/workspace.js). Trocar de projeto grava o cookie e
 * recarrega a página: todo estado em memória é do projeto anterior.
 */
export const WS_COOKIE = "pp-ws";
export const DEFAULT_WS = "default";

export function currentWorkspaceId() {
  try {
    const m = document.cookie.match(/(?:^|;\s*)pp-ws=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : DEFAULT_WS;
  } catch (e) {
    return DEFAULT_WS;
  }
}

export const isDefaultWorkspace = () => currentWorkspaceId() === DEFAULT_WS;

export function switchWorkspace(id) {
  document.cookie = `${WS_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`;
  window.location.reload();
}

/** Prefixo das chaves locais: o padrão mantém as chaves de sempre. */
export function localKey(key) {
  const id = currentWorkspaceId();
  return id === DEFAULT_WS ? key : `ws:${id}:${key}`;
}
