import { openDatabaseSync } from 'expo-sqlite';

/**
 * Base de datos local del teléfono (funciona sin internet).
 * Prisma es para el servidor; aquí usamos SQLite directo con migraciones numeradas.
 * Nunca edites una migración ya publicada: agrega una nueva al final.
 */
export const db = openDatabaseSync('manta.db');

const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS practice_sessions (
     id TEXT PRIMARY KEY NOT NULL,
     lesson_slug TEXT NOT NULL,
     completed_at TEXT NOT NULL,
     duration_sec INTEGER NOT NULL,
     synced INTEGER NOT NULL DEFAULT 0
   );
   CREATE TABLE IF NOT EXISTS downloaded_lessons (
     lesson_slug TEXT NOT NULL,
     locale TEXT NOT NULL,
     version INTEGER NOT NULL,
     local_path TEXT NOT NULL,
     downloaded_at TEXT NOT NULL,
     PRIMARY KEY (lesson_slug, locale)
   );`,
];

export function migrateDatabase(): void {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let index = current; index < MIGRATIONS.length; index++) {
    db.withTransactionSync(() => {
      db.execSync(MIGRATIONS[index]);
      db.execSync(`PRAGMA user_version = ${index + 1}`);
    });
  }
}
