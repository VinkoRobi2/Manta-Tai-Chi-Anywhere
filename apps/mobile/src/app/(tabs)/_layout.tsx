import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/features/navigation/TabBar';
import { appLight } from '@/theme/tokens';

/** Después del onboarding: Inicio, Clases y Perfil. */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: appLight.background },
      }}
    >
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="clases" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
