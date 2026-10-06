import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** Por qué no se puede entrar con Google en este teléfono. */
export type GoogleUnavailable = 'expo-go' | 'not-configured' | 'web';

export class GoogleUnavailableError extends Error {
  constructor(readonly reason: GoogleUnavailable) {
    super(`Entrar con Google no está disponible: ${reason}`);
  }
}

export function googleUnavailable(): GoogleUnavailable | null {
  if (Platform.OS === 'web') return 'web';
  // Expo Go no trae el código nativo de Google: hace falta la app instalada (development build).
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return 'expo-go';
  if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) return 'not-configured';
  return null;
}

/** Abre la ventana de Google. Devuelve el idToken, o null si la persona la cierra sin entrar. */
export async function googleIdToken(): Promise<string | null> {
  const reason = googleUnavailable();
  if (reason) throw new GoogleUnavailableError(reason);

  // Se carga aquí y no arriba: en Expo Go el módulo nativo no existe y la app se cerraría al importarlo.
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } =
    await import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({
    // Con el Web client ID, el idToken va dirigido a nuestra API, que es quien lo verifica.
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;
    if (!response.data.idToken) {
      throw new Error('Google no devolvió el idToken: revisa EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
    }
    return response.data.idToken;
  } catch (error) {
    // Un segundo toque mientras la ventana sigue abierta: no es un error para la persona.
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return null;
    throw error;
  }
}
