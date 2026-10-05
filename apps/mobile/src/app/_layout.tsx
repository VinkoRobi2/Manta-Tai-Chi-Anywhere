import '../global.css';

import { Lexend_300Light } from '@expo-google-fonts/lexend/300Light';
import { Lexend_400Regular } from '@expo-google-fonts/lexend/400Regular';
import { Lexend_500Medium } from '@expo-google-fonts/lexend/500Medium';
import { Lexend_600SemiBold } from '@expo-google-fonts/lexend/600SemiBold';
import { Lexend_800ExtraBold } from '@expo-google-fonts/lexend/800ExtraBold';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { storage } from '@/db/storage';
import { watchWifiForAutoAnchor } from '@/features/downloads/autoAnchor';
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
  watchWifiForAutoAnchor();
  configureNotifications();
  track('app_opened');
  return true;
}

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
        <Stack.Screen name="bienvenida" options={{ animation: 'fade', gestureEnabled: false }} />
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
