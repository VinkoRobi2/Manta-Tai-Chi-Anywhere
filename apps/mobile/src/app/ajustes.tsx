import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-espuma px-6" style={{ paddingTop: insets.top + 16 }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        className="self-start py-3"
      >
        <Text className="text-lg text-marea">{t('lesson.back')}</Text>
      </Pressable>
      <Text className="mt-4 text-3xl font-bold text-abismo">{t('settings.title')}</Text>
      <Text className="mt-6 text-lg text-abismo">{t('settings.language')}</Text>
      <Text className="mt-2 text-base text-abismo/70">
        {t('settings.version', { version: Constants.expoConfig?.version ?? '—' })}
      </Text>
    </View>
  );
}
