/** En la vista web (solo desarrollo) no hay llavero: la sesión va a localStorage. */
export const secure = {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Sin almacenamiento disponible: la sesión dura lo que dure la pestaña.
    }
  },
};
