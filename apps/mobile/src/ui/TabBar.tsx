import type { BottomTabBarProps } from 'expo-router/tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme';
import { contentGlow } from '@/theme/tokens';

import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Text } from './Text';

const ICONS: Record<string, IconName> = { index: 'today', clases: 'classes', bitacora: 'log' };

/**
 * Tinta: pestañas de papel con un punto bermellón bajo la activa.
 * Abisal: una cápsula de vidrio flotante; la pestaña activa se ilumina.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const night = palette.name === 'abisal';

  const tabs = state.routes.map((route, index) => {
    const focused = state.index === index;
    const options = descriptors[route.key]?.options;
    const label = typeof options?.title === 'string' ? options.title : route.name;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };
    return { key: route.key, name: route.name, focused, label, onPress };
  });

  if (night) {
    return (
      <View
        style={{
          backgroundColor: palette.background,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 8,
          paddingHorizontal: 20,
        }}
      >
        <View
          accessibilityRole="tablist"
          style={{
            flexDirection: 'row',
            height: 64,
            borderRadius: 32,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.border,
            alignItems: 'center',
            paddingHorizontal: 6,
          }}
        >
          {tabs.map((tab) => (
            <Press
              key={tab.key}
              haptic
              onPress={tab.onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab.focused }}
              accessibilityLabel={tab.label}
              style={[
                {
                  flex: tab.focused ? 1.6 : 1,
                  height: 52,
                  borderRadius: 26,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  overflow: 'hidden',
                  backgroundColor: tab.focused ? 'rgba(95,227,232,0.16)' : 'transparent',
                },
              ]}
            >
              <View style={tab.focused ? contentGlow(palette, 0.6) : null}>
                <Icon
                  name={ICONS[tab.name] ?? 'today'}
                  size={22}
                  color={tab.focused ? palette.accent : palette.inkSoft}
                />
              </View>
              {tab.focused ? (
                <Text
                  variant="callout"
                  weight="bold"
                  color={palette.accent}
                  maxFontSizeMultiplier={1.4}
                >
                  {tab.label}
                </Text>
              ) : null}
            </Press>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingHorizontal: 16,
        backgroundColor: palette.background,
        borderTopWidth: 1,
        borderTopColor: palette.border,
      }}
    >
      {tabs.map((tab) => (
        <Press
          key={tab.key}
          haptic
          onPress={tab.onPress}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab.focused }}
          accessibilityLabel={tab.label}
          style={{
            flex: 1,
            alignItems: 'center',
            gap: 4,
            minHeight: 56,
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: 12,
          }}
        >
          <Icon
            name={ICONS[tab.name] ?? 'today'}
            size={24}
            color={tab.focused ? palette.ink : palette.inkSoft}
          />
          <Text
            variant="caption"
            weight={tab.focused ? 'bold' : 'regular'}
            color={tab.focused ? palette.ink : palette.inkSoft}
            maxFontSizeMultiplier={1.4}
            style={{ fontSize: 13, lineHeight: 16 }}
          >
            {tab.label}
          </Text>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: tab.focused ? palette.accent : 'transparent',
            }}
          />
        </Press>
      ))}
    </View>
  );
}
