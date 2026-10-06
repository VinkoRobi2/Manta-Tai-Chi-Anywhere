import { Stack } from 'expo-router';

import { useOnboardingPalette } from '@/features/onboarding/responsive';

/** Onboarding: bienvenida, cinco preguntas, "Creando tu plan" y el plan. */
export default function OnboardingLayout() {
  const palette = useOnboardingPalette();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="creando" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="plan" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="idioma"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: 'fitToContents',
          sheetGrabberVisible: true,
          sheetCornerRadius: 28,
        }}
      />
    </Stack>
  );
}
