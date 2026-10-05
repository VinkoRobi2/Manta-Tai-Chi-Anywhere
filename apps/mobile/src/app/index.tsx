import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpaceSelector } from '@/features/space/space-selector';

export default function TodayScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-espuma"
      contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 40 }}
    >
      <Text className="px-6 text-3xl font-bold text-abismo">{t('home.title')}</Text>
      <Text className="mt-2 px-6 text-lg text-abismo/70">{t('home.subtitle')}</Text>

      <SpaceSelector />

      <Link href="/ajustes" asChild>
        <Pressable accessibilityRole="link" className="mt-10 self-start px-6 py-3">
          <Text className="text-base text-marea">{t('settings.title')}</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}
