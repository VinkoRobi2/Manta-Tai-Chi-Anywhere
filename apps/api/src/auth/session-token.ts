import { jwtVerify, SignJWT } from 'jose';

/**
 * La sesión de la app: un token propio de Manta, firmado con AUTH_JWT_SECRET.
 * Así el teléfono no tiene que guardar ni reenviar los tokens de Apple o Google.
 */

const ISSUER = 'manta-api';
const AUDIENCE = 'manta-app';
const DAY_SECONDS = 24 * 60 * 60;

export function sessionKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function signSessionToken(
  userId: string,
  key: Uint8Array,
  days: number,
  now: Date = new Date(),
): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + days * DAY_SECONDS)
    .sign(key);
}

/** Devuelve el id de la persona, o lanza si el token es falso, ajeno o caducó. */
export async function verifySessionToken(token: string, key: Uint8Array): Promise<string> {
  const { payload } = await jwtVerify(token, key, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['HS256'],
  });
  if (!payload.sub) throw new Error('La sesión no trae la persona');
  return payload.sub;
}
