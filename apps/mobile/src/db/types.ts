import type { Locale, SeaState, SpaceMode } from '@manta/shared';

export interface SessionRow {
  id: string;
  lessonSlug: string;
  completedAt: Date;
  durationSec: number;
  mood: SeaState | null;
  spaceMode: SpaceMode;
  careTags: string[];
}

export interface DownloadedRow {
  lessonSlug: string;
  locale: Locale;
  version: number;
  localPath: string;
  sizeBytes: number;
  downloadedAt: Date;
}

/** Lo que la app necesita del almacenamiento local, igual en el teléfono y en la vista web. */
export interface LocalStorage {
  init(): void;
  readSettings(): Record<string, string>;
  writeSetting(key: string, value: string): void;
  listSessions(): SessionRow[];
  insertSession(session: SessionRow): void;
  updateSessionMood(id: string, mood: SeaState | null): void;
  listDownloaded(): DownloadedRow[];
  upsertDownloaded(row: DownloadedRow): void;
  deleteDownloaded(lessonSlug: string): void;
}
