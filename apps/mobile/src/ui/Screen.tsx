import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Text } from './Text';

const BAR = Platform.OS === 'android' ? 64 : 56;

/** Botón redondo de ícono: filete fino en Tinta, vidrio en Abisal. */
export function IconButton({
  name,
  label,
  onPress,
  color,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const palette = useTheme();
  const night = palette.name === 'abisal';
  return (
    <Press
      haptic
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={4}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: night ? palette.surface : 'transparent',
      }}
    >
      <Icon name={name} size={20} color={color ?? palette.ink} />
    </Press>
  );
}

/** El fondo de Abisal: profundidad, una luz arriba y plancton que brilla. En Tinta, papel liso. */
export function Backdrop() {
  const palette = useTheme();
  if (palette.name === 'tinta') return null;
  const plankton: [number, number, number][] = [
    [8, 14, 1.4],
    [24, 7, 1],
    [88, 26, 1.2],
    [5, 52, 1],
    [94, 62, 1.5],
    [52, 84, 1],
    [16, 78, 1.2],
    [76, 12, 0.9],
  ];
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="abismo" cx="85%" cy="0%" rx="110%" ry="60%">
          <Stop offset="0" stopColor="#0E3A4C" />
          <Stop offset="0.45" stopColor="#071B2A" />
          <Stop offset="1" stopColor="#030C14" />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={100} fill="url(#abismo)" />
      {plankton.map(([x, y, r], index) => (
        <Circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={r * 0.3}
          fill={index % 2 ? '#8BF5C8' : '#5FE3E8'}
          opacity={0.55}
        />
      ))}
    </Svg>
  );
}

export interface ScreenProps {
  /** Título de la pantalla. Se muestra grande y aparece pequeño en la barra al bajar. */
  title?: string;
  /** Oculta el título grande (cuando la pantalla tiene su propio encabezado). */
  largeTitle?: boolean;
  back?: boolean;
  right?: ReactNode;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Estructura común: barra superior y contenido con scroll.
 * El título grande va en el contenido; al bajar, aparece pequeño en la barra.
 */
export function Screen({
  title,
  largeTitle = true,
  back = false,
  right,
  children,
  contentStyle,
}: ScreenProps) {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const barBackground = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [8, 40], [0, 1], Extrapolation.CLAMP),
  }));
  const smallTitle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [36, 64], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Backdrop />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          {
            paddingTop: insets.top + BAR,
            paddingBottom: space.xxxl,
            paddingHorizontal: space.gutter,
            gap: space.l,
          },
          contentStyle,
        ]}
      >
        {largeTitle && title ? (
          <Text variant="display" accessibilityRole="header" style={{ marginTop: space.s }}>
            {title}
          </Text>
        ) : null}
        {children}
      </Animated.ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          paddingTop: insets.top,
          height: insets.top + BAR,
        }}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: palette.background,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: palette.border,
            },
            barBackground,
          ]}
        />
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: space.l,
            gap: space.s,
          }}
        >
          <View style={{ minWidth: 48 }}>
            {back ? (
              <IconButton name="back" label={t('common.back')} onPress={() => router.back()} />
            ) : null}
          </View>
          <Animated.View style={[{ flex: 1, alignItems: 'center' }, smallTitle]}>
            {title ? (
              <Text variant="headline" numberOfLines={1} style={{ fontSize: 20, lineHeight: 24 }}>
                {title}
              </Text>
            ) : null}
          </Animated.View>
          <View style={{ minWidth: 48, alignItems: 'flex-end' }}>{right}</View>
        </View>
      </View>
    </View>
  );
}

/** Encabezado de sección: versalitas espaciadas. */
export function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="label" tone="soft" accessibilityRole="header" style={{ marginTop: space.s }}>
      {children}
    </Text>
  );
}
