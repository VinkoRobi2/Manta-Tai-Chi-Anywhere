import '../global.css';

import { Lexend_300Light } from '@expo-google-fonts/lexend/300Light';
import { Lexend_400Regular } from '@expo-google-fonts/lexend/400Regular';
import { Lexend_500Medium } from '@expo-google-fonts/lexend/500Medium';
import { Lexend_600SemiBold } from '@expo-google-fonts/lexend/600SemiBold';
import { Lexend_800ExtraBold } from '@expo-google-fonts/lexend/800ExtraBold';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import { storage } from '@/db/storage';
import { loadSession } from '@/features/auth/session';
import { restoreOnboarding } from '@/features/onboarding/onboarding';
import { loadPractices, startPracticeSync } from '@/features/practice/practice';
import { loadProgress, startProgressSync } from '@/features/progress/progress';
import { loadSettings } from '@/features/settings/settings';
import { track } from '@/lib/analytics';
import { applyLanguage } from '@/lib/i18n';
import { onboardingLight, practiceDark } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

/**
 * Todo lo local se carga de forma síncrona antes de la primera pantalla: no hay red de por medio.
 * Con cuenta, el progreso se sincroniza después, en segundo plano.
 */
function bootLocalData(): true {
  storage.init();
  applyLanguage(loadSettings().language);
  loadProgress();
  restoreOnboarding();
  loadPractices();
  loadSession();
  startProgressSync();
  startPracticeSync();
  track('app_opened');
  return true;
}

/** El onboarding la primera vez; después, Inicio, Clases y Perfil, la ficha de cada clase y la práctica. */
export default function RootLayout() {
  const [ready] = useState(bootLocalData);
  const [fontsLoaded, fontError] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_800ExtraBold,
  });

  useEffect(() => {
    if (ready && (fontsLoaded || fontError)) void SplashScreen.hideAsync();
  }, [ready, fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: onboardingLight.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="bienvenida" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="clase/[slug]" />
      <Stack.Screen
        name="practica/[slug]"
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          contentStyle: { backgroundColor: practiceDark.ground },
        }}
      />
    </Stack>
  );
}
