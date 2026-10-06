import {
  AuthSessionSchema,
  ProgressResponseSchema,
  type AppleSignIn,
  type AuthSession,
  type ProgressResponse,
  type ProgressSnapshot,
} from '@manta/shared';
import Constants from 'expo-constants';

/**
 * Dirección de la API (EXPO_PUBLIC_API_URL, o el puerto 3000 de esta computadora).
 * En el teléfono, "localhost" es el propio teléfono: en desarrollo se cambia por la IP de la
 * computadora que sirve la app con Expo, así funciona sin configurar nada.
 */
function baseUrl(): string {
  const url = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/v1').replace(/\/+$/, '');
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  return devHost ? url.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/])/, `//${devHost}`) : url;
}

/** La API respondió con un error (401, 503…). Si no respondió (sin señal), fetch lanza otro error. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`La API respondió ${status} en ${path}`);
  }
}

interface Schema<T> {
  parse(data: unknown): T;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  token?: string;
}

async function request<T>(
  schema: Schema<T>,
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
): Promise<T> {
  // Sin respuesta en 10 s se da por perdida: mejor seguir sin nube que dejar a la persona esperando.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new ApiError(response.status, path);
    // Validamos la respuesta: si la API cambia sin avisar, fallamos aquí y no en la pantalla.
    return schema.parse(await response.json());
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  signInWithApple: (body: AppleSignIn): Promise<AuthSession> =>
    request(AuthSessionSchema, '/auth/apple', { method: 'POST', body }),

  signInWithGoogle: (idToken: string): Promise<AuthSession> =>
    request(AuthSessionSchema, '/auth/google', { method: 'POST', body: { idToken } }),

  getProgress: (token: string): Promise<ProgressResponse> =>
    request(ProgressResponseSchema, '/me/progress', { token }),

  putProgress: (token: string, snapshot: ProgressSnapshot): Promise<ProgressResponse> =>
    request(ProgressResponseSchema, '/me/progress', { method: 'PUT', body: snapshot, token }),
};
