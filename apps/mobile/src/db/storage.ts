import { SeaStateSchema, SpaceModeSchema } from '@manta/shared';

import { db, migrateDatabase } from './database';
import type { LocalStorage, StoredPractice } from './types';

interface PracticeRow {
  id: string;
  lesson_slug: string;
  completed_at: string;
  duration_sec: number;
  mood: string | null;
  space_mode: string;
  synced: number;
}

function fromRow(row: PracticeRow): StoredPractice {
  return {
    id: row.id,
    lessonSlug: row.lesson_slug,
    completedAt: row.completed_at,
    durationSec: row.duration_sec,
    mood: SeaStateSchema.safeParse(row.mood).data ?? null,
    spaceMode: SpaceModeSchema.safeParse(row.space_mode).data ?? 'SEATED',
    synced: row.synced === 1,
  };
}

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

  readPractices() {
    return db
      .getAllSync<PracticeRow>(
        `SELECT id, lesson_slug, completed_at, duration_sec, mood, space_mode, synced
         FROM practice_sessions ORDER BY completed_at`,
      )
      .map(fromRow);
  },

  insertPractices(practices) {
    db.withTransactionSync(() => {
      for (const practice of practices) {
        db.runSync(
          `INSERT OR IGNORE INTO practice_sessions
             (id, lesson_slug, completed_at, duration_sec, mood, space_mode, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          practice.id,
          practice.lessonSlug,
          practice.completedAt,
          practice.durationSec,
          practice.mood,
          practice.spaceMode,
          practice.synced ? 1 : 0,
        );
      }
    });
  },

  markPracticesSynced(ids) {
    db.withTransactionSync(() => {
      for (const id of ids) db.runSync('UPDATE practice_sessions SET synced = 1 WHERE id = ?', id);
    });
  },

  clearPractices() {
    db.runSync('DELETE FROM practice_sessions');
  },
};
