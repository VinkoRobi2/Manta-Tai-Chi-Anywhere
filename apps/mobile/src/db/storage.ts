import { db, migrateDatabase } from './database';
import type { LocalStorage } from './types';

/** Almacenamiento del teléfono: SQLite. La vista web usa storage.web.ts. */
export const storage: LocalStorage = {
  init() {
    migrateDatabase();
  },

  readSettings() {
    const rows = db.getAllSync<{ key: string; value: string }>('SELECT key, value FROM settings');
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  },

  writeSetting(key, value) {
    db.runSync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      key,
      value,
    );
  },
};
