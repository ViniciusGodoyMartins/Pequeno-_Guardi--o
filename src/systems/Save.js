const STORAGE_PREFIX = "cyber-v21:";
const STATE_KEY = "state";

const DEFAULT_STATE = {
  unlocked: 1,
  best: 0,
  sound: true,
};

export const Save = {
  get(key, defaultValue) {
    try {
      const value = localStorage.getItem(STORAGE_PREFIX + key);

      if (value === null) {
        return defaultValue;
      }

      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(
        STORAGE_PREFIX + key,
        JSON.stringify(value)
      );
    } catch {
      // Ignora erros de armazenamento
    }
  },

  state() {
    return this.get(STATE_KEY, DEFAULT_STATE);
  },

  patch(newValues) {
    const currentState = this.state();

    this.set(STATE_KEY, {
      ...currentState,
      ...newValues,
    });
  },
};