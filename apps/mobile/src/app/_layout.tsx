import '../global.css';
import '@/lib/i18n';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { migrateDatabase } from '@/db/database';

export default function RootLayout() {
  useEffect(() => {
    migrateDatabase();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#EEF4F5' } }} />
    </>
  );
}
