import type { BottomTabBarProps } from 'expo-router/tabs';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme';

import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Text } from './Text';

const ICONS: Record<string, IconName> = { index: 'today', clases: 'classes', bitacora: 'log' };

/**
 * Barra de pestañas propia, fiel a cada sistema.
 * iOS: íconos con etiqueta, color de acento en la activa, fondo translúcido.
 * Android: barra de navegación de Material 3 con píldora detrás del ícono activo.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const android = Platform.OS === 'android';

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        paddingTop: android ? 12 : 8,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingHorizontal: android ? 8 : 16,
        backgroundColor: android
          ? palette.surfaceAlt
          : palette.scheme === 'dark'
            ? 'rgba(6,35,43,0.94)'
            : 'rgba(246,250,250,0.96)',
        borderTopWidth: android ? 0 : 0.5,
        borderTopColor: palette.border,
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key]?.options;
        const label = typeof options?.title === 'string' ? options.title : route.name;
        const color = android ? palette.ink : focused ? palette.accent : palette.inkSoft;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Press
            key={route.key}
            haptic
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: android ? 4 : 2,
              minHeight: 52,
              justifyContent: 'center',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <View
              style={
                android
                  ? {
                      width: 64,
                      height: 32,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: focused ? palette.tonal : 'transparent',
                    }
                  : { height: 28, justifyContent: 'center' }
              }
            >
              <Icon name={ICONS[route.name] ?? 'today'} size={android ? 24 : 26} color={color} />
            </View>
            <Text
              variant="caption"
              weight={focused ? 'semibold' : 'medium'}
              color={color}
              maxFontSizeMultiplier={1.4}
              style={{ fontSize: android ? 12 : 11, lineHeight: 15 }}
            >
              {label}
            </Text>
          </Press>
        );
      })}
    </View>
  );
}
