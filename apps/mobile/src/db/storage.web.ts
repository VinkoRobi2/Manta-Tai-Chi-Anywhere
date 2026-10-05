import type { DownloadedRow, LocalStorage, SessionRow } from './types';

/**
 * Almacenamiento para la vista web (solo desarrollo y capturas de diseño).
 * Guarda en localStorage cuando existe y, si no, en memoria.
 */

const KEY = 'manta-dev-storage';

interface State {
  settings: Record<string, string>;
  sessions: (Omit<SessionRow, 'completedAt'> & { completedAt: string })[];
  downloaded: (Omit<DownloadedRow, 'downloadedAt'> & { downloadedAt: string })[];
}

let state: State = { settings: {}, sessions: [], downloaded: [] };

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

  listSessions: () =>
    state.sessions
      .map((row) => ({ ...row, completedAt: new Date(row.completedAt) }))
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()),

  insertSession(session) {
    state.sessions.push({ ...session, completedAt: session.completedAt.toISOString() });
    persist();
  },

  updateSessionMood(id, mood) {
    const row = state.sessions.find((item) => item.id === id);
    if (row) row.mood = mood;
    persist();
  },

  listDownloaded: () =>
    state.downloaded.map((row) => ({ ...row, downloadedAt: new Date(row.downloadedAt) })),

  upsertDownloaded(row) {
    state.downloaded = state.downloaded.filter((item) => item.lessonSlug !== row.lessonSlug);
    state.downloaded.push({ ...row, downloadedAt: row.downloadedAt.toISOString() });
    persist();
  },

  deleteDownloaded(lessonSlug) {
    state.downloaded = state.downloaded.filter((item) => item.lessonSlug !== lessonSlug);
    persist();
  },
};
