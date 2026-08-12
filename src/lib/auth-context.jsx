import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Sessão da plataforma, do lado do cliente.
 *
 * É superfície, não autorização: o papel vem de `/api/auth/me`, que verifica o
 * JWT e resolve a concessão no servidor. Esconder um botão aqui é conveniência —
 * o que impede a escrita de fato é o gate no servidor de dados. Enquanto o board
 * mora no localStorage não há servidor de dados nenhum, então trate estes
 * helpers como o contrato que a UI respeita, e mantenha-os do lado do servidor
 * quando o board sair do browser.
 */
const AuthCtx = createContext(null);

export function useAuth() {
  const value = useContext(AuthCtx);
  if (!value) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return value;
}

export function AuthProvider({ children }) {
  // loading → anon → authed. `error` só existe para o anon (motivo da recusa).
  const [state, setState] = useState({ status: "loading", user: null, role: null, error: "" });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (!alive) return;
        if (!res.ok) {
          setState({ status: "anon", user: null, role: null, error: "" });
          return;
        }
        const data = await res.json();
        setState({ status: "authed", user: data.user, role: data.role, error: "" });
      } catch (e) {
        if (alive) setState({ status: "anon", user: null, role: null, error: "" });
      }
    })();
    return () => { alive = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.message || "Credenciais inválidas";
        setState({ status: "anon", user: null, role: null, error: message });
        return { ok: false, message };
      }
      setState({ status: "authed", user: data.user, role: data.role, error: "" });
      return { ok: true };
    } catch (e) {
      const message = "Erro de conexão. Tente novamente.";
      setState({ status: "anon", user: null, role: null, error: message });
      return { ok: false, message };
    }
  }, []);

  const logout = useCallback(async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (e) {}
    setState({ status: "anon", user: null, role: null, error: "" });
  }, []);

  const value = useMemo(() => {
    const { status, user, role, error } = state;
    const isSuper = role === "super";
    const email = user ? user.email : null;
    return {
      status, user, role, error, login, logout,
      isSuper,
      /** Só o super mexe no que é de todos: ordem das listas, colunas de
          Projetos/Tarefas, destaques do Semanal e o sync da planilha. */
      canWriteShared: isSuper,
      /** Incluir card no Roadmap: super e admin. */
      canCreateCard: isSuper || role === "admin",
      /** Editar/excluir um card: o super em qualquer um, o admin só nos seus. Um
          épico vindo da planilha não tem dono e por isso não é do admin. */
      ownsCard: (epic) => {
        if (isSuper) return true;
        if (role !== "admin" || !epic || !email) return false;
        return epic.createdBy === email;
      },
    };
  }, [state, login, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
