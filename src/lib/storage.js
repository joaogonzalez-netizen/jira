import { localKey } from "./workspace";

// Cache local dos dados (planilha, Roadmap) — separado por projeto: o padrão
// usa as chaves de sempre, os outros ganham o prefixo do projeto.
const storage = {
  async get(key) {
    try {
      const raw = localStorage.getItem(localKey(key));
      return raw === null ? null : { value: raw };
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    localStorage.setItem(localKey(key), value);
  },
};

export default storage;
