import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';

/**
 * Verifica los tokens que la app recibe al entrar con Apple o con Google:
 * firma con las claves públicas del proveedor, emisor, destinatario (nuestra app) y caducidad.
 * Si algo no cuadra, jose lanza un error y la API responde 401.
 */

export type IdentityProvider = 'apple' | 'google';

/** Quién es la persona según Apple o Google, ya verificado. */
export interface VerifiedIdentity {
  provider: IdentityProvider;
  /** Identificador estable de la persona en ese proveedor (el "sub" del token). */
  subject: string;
  /** Solo si el proveedor dice que está verificado. */
  email: string | null;
  name: string | null;
}

export const APPLE_ISSUER = 'https://appleid.apple.com';
export const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/** Claves públicas de cada proveedor. jose las descarga la primera vez y las guarda en caché. */
export const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
export const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export async function verifyAppleToken(
  token: string,
  keys: JWTVerifyGetKey,
  audiences: string[],
): Promise<VerifiedIdentity> {
  const { payload } = await jwtVerify(token, keys, {
    issuer: APPLE_ISSUER,
    audience: audiences,
    algorithms: ['RS256'],
  });
  // Apple no manda el nombre en el token: la app lo reenvía la primera vez.
  return {
    provider: 'apple',
    subject: subjectOf(payload),
    email: verifiedEmail(payload),
    name: null,
  };
}

export async function verifyGoogleToken(
  token: string,
  keys: JWTVerifyGetKey,
  audiences: string[],
): Promise<VerifiedIdentity> {
  if (audiences.length === 0)
    throw new Error('Google no está configurado: falta GOOGLE_CLIENT_IDS');
  const { payload } = await jwtVerify(token, keys, {
    issuer: GOOGLE_ISSUERS,
    audience: audiences,
    algorithms: ['RS256'],
  });
  const name = typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : null;
  return { provider: 'google', subject: subjectOf(payload), email: verifiedEmail(payload), name };
}

function subjectOf(payload: JWTPayload): string {
  if (!payload.sub) throw new Error('El token no trae el identificador de la persona');
  return payload.sub;
}

/** Apple manda email_verified como texto ("true"); Google, como booleano. */
function verifiedEmail(payload: JWTPayload): string | null {
  const verified = payload.email_verified === true || payload.email_verified === 'true';
  return verified && typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
}
