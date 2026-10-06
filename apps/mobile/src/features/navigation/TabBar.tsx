import type { BottomTabBarProps } from 'expo-router/tabs';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Squish } from '@/features/onboarding/Squish';
import { appLight } from '@/theme/tokens';
import { ClassesGlyph, HomeGlyph, ProfileGlyph, type GlyphProps } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

const TABS: Record<string, { label: string; Icon: ComponentType<GlyphProps> }> = {
  inicio: { label: 'tabs.home', Icon: HomeGlyph },
  clases: { label: 'tabs.classes', Icon: ClassesGlyph },
  perfil: { label: 'tabs.profile', Icon: ProfileGlyph },
};

/** Alto de la barra sin el área segura de abajo: las pantallas dejan este espacio al final. */
export const TAB_BAR_HEIGHT = 64;

/**
 * La barra de abajo: tres pestañas grandes, con icono y nombre siempre visibles.
 * La activa va en negro con un punto de sol debajo; las otras en gris legible.
 */
export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { t } = useTranslation();
  const palette = appLight;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: palette.background,
        borderTopWidth: 1,
        borderTopColor: palette.line,
        paddingBottom: insets.bottom,
      }}
    >
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const color = focused ? palette.ink : palette.muted;
        const label = t(tab.label);
        return (
          <Squish
            key={route.key}
            containerStyle={{ flex: 1 }}
            haptic={!focused}
            pressedScale={0.94}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{
              height: TAB_BAR_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <tab.Icon color={color} size={26} strokeWidth={focused ? 2.1 : 1.8} />
            <Text
              weight={focused ? 'semibold' : 'medium'}
              color={color}
              maxFontSizeMultiplier={1.3}
              style={{ fontSize: 12, lineHeight: 15 }}
            >
              {label}
            </Text>
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: focused ? palette.accent : 'transparent',
              }}
            />
          </Squish>
        );
      })}
    </View>
  );
}
