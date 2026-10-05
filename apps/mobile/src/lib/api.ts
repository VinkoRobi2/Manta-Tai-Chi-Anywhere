import {
  CatalogManifestSchema,
  DownloadGrantSchema,
  type CatalogManifest,
  type DownloadGrant,
  type Locale,
} from '@manta/shared';
import type { z } from 'zod';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

async function request<S extends z.ZodType>(
  schema: S,
  path: string,
  init: RequestInit = {},
  appUserId?: string,
): Promise<z.infer<S>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(appUserId ? { 'x-app-user-id': appUserId } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`La API respondió ${response.status} en ${path}`);
  }
  // Validamos la respuesta: si la API cambia sin avisar, fallamos aquí y no en la pantalla.
  return schema.parse(await response.json());
}

export const api = {
  catalog: (locale: Locale): Promise<CatalogManifest> =>
    request(CatalogManifestSchema, `/catalog?locale=${locale}`),

  requestDownload: (slug: string, locale: Locale, appUserId?: string): Promise<DownloadGrant> =>
    request(
      DownloadGrantSchema,
      `/lessons/${encodeURIComponent(slug)}/download`,
      { method: 'POST', body: JSON.stringify({ locale }) },
      appUserId,
    ),
};
