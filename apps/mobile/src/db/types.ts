import type { PracticeSession } from '@manta/shared';

/** Una práctica guardada en el teléfono y si la nube ya la tiene. */
export interface StoredPractice extends PracticeSession {
  synced: boolean;
}

/** Lo que la app necesita del almacenamiento local, igual en el teléfono y en la vista web. */
export interface LocalStorage {
  init(): void;
  readSettings(): Record<string, string>;
  writeSetting(key: string, value: string): void;
  /** Todas las prácticas, de la más antigua a la más reciente. */
  readPractices(): StoredPractice[];
  /** Guarda prácticas nuevas; las que ya existen (mismo id) no se tocan. */
  insertPractices(practices: readonly StoredPractice[]): void;
  markPracticesSynced(ids: readonly string[]): void;
  /** Borra todas las prácticas del teléfono (no las de la nube). */
  clearPractices(): void;
}
