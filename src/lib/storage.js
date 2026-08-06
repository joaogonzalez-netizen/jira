const storage = {
  async get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? null : { value: raw };
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
};

export default storage;
