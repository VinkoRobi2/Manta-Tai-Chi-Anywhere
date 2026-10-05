import '../global.css';

import { AtkinsonHyperlegibleNext_400Regular } from '@expo-google-fonts/atkinson-hyperlegible-next/400Regular';
import { AtkinsonHyperlegibleNext_500Medium } from '@expo-google-fonts/atkinson-hyperlegible-next/500Medium';
import { AtkinsonHyperlegibleNext_600SemiBold } from '@expo-google-fonts/atkinson-hyperlegible-next/600SemiBold';
import { AtkinsonHyperlegibleNext_700Bold } from '@expo-google-fonts/atkinson-hyperlegible-next/700Bold';
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond/500Medium';
import { CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond/500Medium_Italic';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { Sora_500Medium } from '@expo-google-fonts/sora/500Medium';
import { Sora_600SemiBold } from '@expo-google-fonts/sora/600SemiBold';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { storage } from '@/db/storage';
import { loadDownloads } from '@/features/downloads/downloads';
import { configureNotifications } from '@/features/reminders/reminders';
import { loadSessions } from '@/features/sessions/sessions';
import { loadSettings } from '@/features/settings/settings';
import { track } from '@/lib/analytics';
import { applyLanguage } from '@/lib/i18n';
import { ThemeProvider, useTheme } from '@/theme/theme';

void SplashScreen.preventAutoHideAsync();

/** Todo lo local se carga de forma síncrona antes de la primera pantalla: no hay red de por medio. */
function bootLocalData(): true {
  storage.init();
  const settings = loadSettings();
  applyLanguage(settings.language);
  loadSessions();
  loadDownloads();
  configureNotifications();
  track('app_opened');
  return true;
}

export default function RootLayout() {
  const [ready] = useState(bootLocalData);
  const [fontsLoaded, fontError] = useFonts({
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_500Medium,
    AtkinsonHyperlegibleNext_600SemiBold,
    AtkinsonHyperlegibleNext_700Bold,
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    Sora_500Medium,
    Sora_600SemiBold,
  });

  useEffect(() => {
    if (ready && (fontsLoaded || fontError)) void SplashScreen.hideAsync();
  }, [ready, fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}

function RootStack() {
  const palette = useTheme();
  const sheet = {
    presentation: 'formSheet',
    sheetGrabberVisible: true,
    sheetCornerRadius: Platform.OS === 'android' ? 28 : 34,
    contentStyle: { backgroundColor: palette.surface },
  } as const;

  return (
    <>
      <StatusBar style={palette.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="clase/[slug]" options={{ ...sheet, sheetAllowedDetents: [0.72, 1] }} />
        <Stack.Screen name="salud" options={{ ...sheet, sheetAllowedDetents: [0.6, 1] }} />
        <Stack.Screen
          name="reproductor/[slug]"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
            gestureEnabled: false,
            contentStyle: { backgroundColor: '#06232B' },
          }}
        />
        <Stack.Screen
          name="final/[slug]"
          options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="manta-completa" options={{ presentation: 'modal' }} />
        <Stack.Screen name="zarpar" />
        <Stack.Screen name="ajustes" />
      </Stack>
    </>
  );
}
