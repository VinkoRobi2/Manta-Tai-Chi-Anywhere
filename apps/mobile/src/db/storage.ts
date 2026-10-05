import { SeaStateSchema, SpaceModeSchema, LocaleSchema } from '@manta/shared';

import { db, migrateDatabase } from './database';
import type { DownloadedRow, LocalStorage, SessionRow } from './types';

/** Almacenamiento del teléfono: SQLite. La vista web usa storage.web.ts. */

interface SessionRecord {
  id: string;
  lesson_slug: string;
  completed_at: string;
  duration_sec: number;
  mood: string | null;
  space_mode: string;
  care_tags: string | null;
}

interface DownloadedRecord {
  lesson_slug: string;
  locale: string;
  version: number;
  local_path: string;
  size_bytes: number;
  downloaded_at: string;
}

function parseTags(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : [];
  } catch {
    return [];
  }
}

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

  listSessions() {
    const rows = db.getAllSync<SessionRecord>(
      'SELECT id, lesson_slug, completed_at, duration_sec, mood, space_mode, care_tags FROM practice_sessions ORDER BY completed_at DESC',
    );
    return rows.map((row): SessionRow => ({
      id: row.id,
      lessonSlug: row.lesson_slug,
      completedAt: new Date(row.completed_at),
      durationSec: row.duration_sec,
      mood: SeaStateSchema.safeParse(row.mood).data ?? null,
      spaceMode: SpaceModeSchema.safeParse(row.space_mode).data ?? 'SEATED',
      careTags: parseTags(row.care_tags),
    }));
  },

  insertSession(session) {
    db.runSync(
      `INSERT INTO practice_sessions (id, lesson_slug, completed_at, duration_sec, mood, space_mode, care_tags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      session.id,
      session.lessonSlug,
      session.completedAt.toISOString(),
      session.durationSec,
      session.mood,
      session.spaceMode,
      JSON.stringify(session.careTags),
    );
  },

  updateSessionMood(id, mood) {
    db.runSync('UPDATE practice_sessions SET mood = ? WHERE id = ?', mood, id);
  },

  listDownloaded() {
    const rows = db.getAllSync<DownloadedRecord>(
      'SELECT lesson_slug, locale, version, local_path, size_bytes, downloaded_at FROM downloaded_lessons',
    );
    return rows.map((row): DownloadedRow => ({
      lessonSlug: row.lesson_slug,
      locale: LocaleSchema.safeParse(row.locale).data ?? 'es',
      version: row.version,
      localPath: row.local_path,
      sizeBytes: row.size_bytes,
      downloadedAt: new Date(row.downloaded_at),
    }));
  },

  upsertDownloaded(row) {
    db.runSync(
      `INSERT INTO downloaded_lessons (lesson_slug, locale, version, local_path, size_bytes, downloaded_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(lesson_slug, locale) DO UPDATE SET
         version = excluded.version, local_path = excluded.local_path,
         size_bytes = excluded.size_bytes, downloaded_at = excluded.downloaded_at`,
      row.lessonSlug,
      row.locale,
      row.version,
      row.localPath,
      row.sizeBytes,
      row.downloadedAt.toISOString(),
    );
  },

  deleteDownloaded(lessonSlug) {
    db.runSync('DELETE FROM downloaded_lessons WHERE lesson_slug = ?', lessonSlug);
  },
};
