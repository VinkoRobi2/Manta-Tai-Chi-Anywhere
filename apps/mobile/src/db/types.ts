/** Lo que la app necesita del almacenamiento local, igual en el teléfono y en la vista web. */
export interface LocalStorage {
  init(): void;
  readSettings(): Record<string, string>;
  writeSetting(key: string, value: string): void;
}
