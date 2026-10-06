import * as SecureStore from 'expo-secure-store';

/** Datos sensibles (la sesión) en el llavero del teléfono. La vista web usa secure.web.ts. */
export const secure = {
  get: (key: string): string | null => SecureStore.getItem(key),
  set: (key: string, value: string): void => SecureStore.setItem(key, value),
  remove: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),
};
