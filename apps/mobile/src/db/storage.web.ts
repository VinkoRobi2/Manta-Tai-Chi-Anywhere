import type { LocalStorage } from './types';

/**
 * Almacenamiento para la vista web (solo desarrollo y capturas de diseño).
 * Guarda en localStorage cuando existe y, si no, en memoria.
 */

const KEY = 'manta-dev-storage';

interface State {
  settings: Record<string, string>;
}

let state: State = { settings: {} };

function persist() {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(state));
  } catch {
    // Sin almacenamiento disponible: seguimos en memoria.
  }
}

export const storage: LocalStorage = {
  init() {
    try {
      const raw = globalThis.localStorage?.getItem(KEY);
      if (raw) state = { ...state, ...(JSON.parse(raw) as Partial<State>) };
    } catch {
      // Datos corruptos o acceso bloqueado: empezamos de cero.
    }
  },

  readSettings: () => ({ ...state.settings }),

  writeSetting(key, value) {
    state.settings[key] = value;
    persist();
  },
};
