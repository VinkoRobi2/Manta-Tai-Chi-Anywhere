import { sessionKey, signSessionToken, verifySessionToken } from './session-token.js';

const key = sessionKey('un-secreto-de-prueba-de-al-menos-32-caracteres');

describe('sesión de la app', () => {
  it('firma y reconoce a la persona', async () => {
    const token = await signSessionToken('persona-1', key, 180);
    await expect(verifySessionToken(token, key)).resolves.toBe('persona-1');
  });

  it('rechaza tokens firmados con otro secreto', async () => {
    const token = await signSessionToken(
      'persona-1',
      sessionKey('otro-secreto-distinto-de-32-caracteres!!'),
      180,
    );
    await expect(verifySessionToken(token, key)).rejects.toThrow();
  });

  it('rechaza sesiones caducadas', async () => {
    const longAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    const token = await signSessionToken('persona-1', key, 180, longAgo);
    await expect(verifySessionToken(token, key)).rejects.toThrow();
  });

  it('rechaza tokens modificados', async () => {
    const [header, , signature] = (await signSessionToken('persona-1', key, 180)).split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'otra-persona' })).toString('base64url');
    await expect(verifySessionToken(`${header}.${forged}.${signature}`, key)).rejects.toThrow();
  });
});
