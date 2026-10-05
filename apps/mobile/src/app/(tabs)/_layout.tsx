import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { useTranslation } from 'react-i18next';

import { isOnboarded } from '@/features/onboarding/onboarding';
import { useSettings } from '@/features/settings/settings';
import { useTheme } from '@/theme/theme';
import { TabBar } from '@/ui/TabBar';

export default function TabsLayout() {
  const { t } = useTranslation();
  const palette = useTheme();
  const settings = useSettings();
  // La primera vez, antes de las pestañas, va el onboarding.
  if (!isOnboarded(settings)) return <Redirect href="/bienvenida" />;
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: palette.background } }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.today') }} />
      <Tabs.Screen name="clases" options={{ title: t('tabs.classes') }} />
      <Tabs.Screen name="bitacora" options={{ title: t('tabs.log') }} />
    </Tabs>
  );
}
