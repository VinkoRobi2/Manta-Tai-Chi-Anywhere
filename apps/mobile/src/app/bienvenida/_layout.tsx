import { Stack } from 'expo-router';

import { useOnboardingPalette } from '@/features/onboarding/responsive';
import { welcome } from '@/theme/tokens';

/** Onboarding: bienvenida a pantalla completa, cinco preguntas y el plan. */
export default function OnboardingLayout() {
  const palette = useOnboardingPalette();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ animation: 'fade', contentStyle: { backgroundColor: welcome.ground } }}
      />
      <Stack.Screen name="plan" options={{ animation: 'fade' }} />
    </Stack>
  );
}
