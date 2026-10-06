import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Configuración sobre app.json. El login con Google se añade solo cuando existe el
 * Client ID de iOS: su esquema de URL es ese ID al revés, y uno inventado rompería la app instalada.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins = [...(config.plugins ?? [])];
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (iosClientId) {
    const iosUrlScheme = `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`;
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }
  return { ...config, name: config.name ?? 'Manta', slug: config.slug ?? 'manta', plugins };
};
