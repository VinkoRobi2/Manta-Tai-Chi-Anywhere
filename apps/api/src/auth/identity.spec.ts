import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type CryptoKey,
  type JWTVerifyGetKey,
} from 'jose';
import { APPLE_ISSUER, verifyAppleToken, verifyGoogleToken } from './identity.js';

const APP = 'com.mantataichi.app';
const EXPO_GO = 'host.exp.Exponent';
const GOOGLE_CLIENT = '1234-web.apps.googleusercontent.com';

let signingKey: CryptoKey;
let strangerKey: CryptoKey;
let keys: JWTVerifyGetKey;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  signingKey = pair.privateKey;
  strangerKey = (await generateKeyPair('RS256')).privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'clave-1', alg: 'RS256', use: 'sig' };
  keys = createLocalJWKSet({ keys: [jwk] });
});

interface TokenOptions {
  issuer: string;
  audience: string;
  claims?: Record<string, unknown>;
  expiresAt?: number;
  key?: CryptoKey;
}

function token({ issuer, audience, claims = {}, expiresAt, key }: TokenOptions): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'clave-1' })
    .setSubject('persona-123')
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt(now - 60)
    .setExpirationTime(expiresAt ?? now + 600)
    .sign(key ?? signingKey);
}

describe('verifyAppleToken', () => {
  it('reconoce a la persona y su correo verificado (Apple lo manda como texto)', async () => {
    const identity = await verifyAppleToken(
      await token({
        issuer: APPLE_ISSUER,
        audience: APP,
        claims: { email: 'Ana@privaterelay.appleid.com', email_verified: 'true' },
      }),
      keys,
      [APP],
    );
    expect(identity).toEqual({
      provider: 'apple',
      subject: 'persona-123',
      email: 'ana@privaterelay.appleid.com',
      name: null,
    });
  });

  it('acepta Expo Go solo si está en la lista', async () => {
    const fromExpoGo = await token({ issuer: APPLE_ISSUER, audience: EXPO_GO });
    await expect(verifyAppleToken(fromExpoGo, keys, [APP, EXPO_GO])).resolves.toMatchObject({
      subject: 'persona-123',
    });
    await expect(verifyAppleToken(fromExpoGo, keys, [APP])).rejects.toThrow();
  });

  it('rechaza tokens de otra app, de Google, caducados o firmados con otra clave', async () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    const tokens = await Promise.all([
      token({ issuer: APPLE_ISSUER, audience: 'com.otra.app' }),
      token({ issuer: 'https://accounts.google.com', audience: APP }),
      token({ issuer: APPLE_ISSUER, audience: APP, expiresAt: past }),
      token({ issuer: APPLE_ISSUER, audience: APP, key: strangerKey }),
    ]);
    for (const bad of tokens) await expect(verifyAppleToken(bad, keys, [APP])).rejects.toThrow();
    await expect(verifyAppleToken('esto-no-es-un-token', keys, [APP])).rejects.toThrow();
  });

  it('no guarda correos sin verificar', async () => {
    const identity = await verifyAppleToken(
      await token({
        issuer: APPLE_ISSUER,
        audience: APP,
        claims: { email: 'ana@example.com', email_verified: 'false' },
      }),
      keys,
      [APP],
    );
    expect(identity.email).toBeNull();
  });
});

describe('verifyGoogleToken', () => {
  it('acepta los dos emisores de Google y trae el nombre', async () => {
    for (const issuer of ['https://accounts.google.com', 'accounts.google.com']) {
      const identity = await verifyGoogleToken(
        await token({
          issuer,
          audience: GOOGLE_CLIENT,
          claims: { email: 'ana@gmail.com', email_verified: true, name: ' Ana Pérez ' },
        }),
        keys,
        [GOOGLE_CLIENT],
      );
      expect(identity).toEqual({
        provider: 'google',
        subject: 'persona-123',
        email: 'ana@gmail.com',
        name: 'Ana Pérez',
      });
    }
  });

  it('rechaza tokens para otro client ID', async () => {
    const other = await token({ issuer: 'https://accounts.google.com', audience: 'otro-client' });
    await expect(verifyGoogleToken(other, keys, [GOOGLE_CLIENT])).rejects.toThrow();
  });

  it('sin client IDs configurados no acepta nada', async () => {
    const valid = await token({ issuer: 'https://accounts.google.com', audience: GOOGLE_CLIENT });
    await expect(verifyGoogleToken(valid, keys, [])).rejects.toThrow('GOOGLE_CLIENT_IDS');
  });
});
