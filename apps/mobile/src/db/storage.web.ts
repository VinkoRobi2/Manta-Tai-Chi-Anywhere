import type { LocalStorage, StoredPractice } from './types';

/**
 * Almacenamiento para la vista web (solo desarrollo y capturas de diseño).
 * Guarda en localStorage cuando existe y, si no, en memoria.
 */

const KEY = 'manta-dev-storage';

interface State {
  settings: Record<string, string>;
  practices: StoredPractice[];
}

let state: State = { settings: {}, practices: [] };

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

  readPractices: () =>
    [...state.practices].sort((a, b) => a.completedAt.localeCompare(b.completedAt)),

  insertPractices(practices) {
    const known = new Set(state.practices.map((practice) => practice.id));
    state.practices = [
      ...state.practices,
      ...practices.filter((practice) => !known.has(practice.id)),
    ];
    persist();
  },

  markPracticesSynced(ids) {
    const synced = new Set(ids);
    state.practices = state.practices.map((practice) =>
      synced.has(practice.id) ? { ...practice, synced: true } : practice,
    );
    persist();
  },

  clearPractices() {
    state.practices = [];
    persist();
  },
};
