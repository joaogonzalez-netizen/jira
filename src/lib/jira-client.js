/**
 * Cliente da escrita no Jira (`/api/jira/epics`). Só fala HTTP: quem decide o
 * que fazer com a resposta (novo estado do Roadmap, mensagem de erro) é o
 * `DataProvider`. O token do Jira nunca passa por aqui — fica no servidor.
 */

async function call(method, url, body) {
  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { message: "Sem conexão com o servidor" } };
  }
}

const result = (r) =>
  r.ok
    ? { ok: true, state: r.data.state, rev: r.data.rev, key: r.data.key, oldKey: r.data.oldKey, warning: r.data.warning }
    : { ok: false, status: r.status, message: r.data?.message || `Erro ${r.status}`, jiraKey: r.data?.jiraKey };

export const jiraApi = {
  /** `true`/`false`, ou `null` se não deu pra saber (rede). */
  async status() {
    const r = await call("GET", "/api/jira/epics");
    return r.ok ? !!r.data.configured : null;
  },
  createEpic: async ({ key, summary, product, description, position }) => result(await call("POST", "/api/jira/epics", { key, summary, product, description, position })),
  renameEpic: async ({ key, summary }) => result(await call("PATCH", "/api/jira/epics", { key, summary })),
  cancelEpic: async ({ key }) => result(await call("DELETE", `/api/jira/epics?key=${encodeURIComponent(key)}`)),
};
