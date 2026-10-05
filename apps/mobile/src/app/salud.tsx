import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { updateSettings } from '@/features/settings/settings';
import { space } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';

export default function HealthNote() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={{
        padding: space.xl,
        paddingBottom: insets.bottom + space.xl,
        gap: space.l,
      }}
    >
      <Text variant="title" accessibilityRole="header">
        {t('health.title')}
      </Text>
      {(['body1', 'body2', 'body3', 'body4'] as const).map((key) => (
        <Text key={key} variant="body">
          {t(`health.${key}`)}
        </Text>
      ))}
      <Button
        label={t('health.ok')}
        onPress={() => {
          updateSettings({ safetySeen: true });
          router.back();
        }}
      />
    </ScrollView>
  );
}
