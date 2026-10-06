import type { AppleSignIn } from '@manta/shared';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

/** Entrar con Apple solo existe en iPhone y iPad (también en Expo Go). */
export async function isAppleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

/** Abre la hoja de Apple. Devuelve null si la persona la cierra sin entrar. */
export async function appleCredential(): Promise<AppleSignIn | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('Apple no devolvió el token de identidad');
    // Apple manda el nombre solo la primera vez: se reenvía a la API para guardarlo.
    const { givenName, familyName } = credential.fullName ?? {};
    const fullName = [givenName, familyName].filter(Boolean).join(' ') || null;
    return { identityToken: credential.identityToken, fullName };
  } catch (error) {
    if (isCancel(error)) return null;
    throw error;
  }
}

function isCancel(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ERR_REQUEST_CANCELED'
  );
}
