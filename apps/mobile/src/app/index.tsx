import { Redirect } from 'expo-router';

/** Por ahora la app es solo el onboarding. */
export default function Index() {
  return <Redirect href="/bienvenida" />;
}
