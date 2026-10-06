import { Redirect } from 'expo-router';

import { useSettings } from '@/features/settings/settings';

/** La primera vez, el onboarding; después, Inicio. */
export default function Index() {
  const { onboardingDone } = useSettings();
  return <Redirect href={onboardingDone ? '/inicio' : '/bienvenida'} />;
}
