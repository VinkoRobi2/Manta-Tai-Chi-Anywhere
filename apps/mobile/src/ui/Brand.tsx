import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme/theme';
import { contentGlow } from '@/theme/tokens';

import { Text } from './Text';

const MANTA_PATH =
  'M60 14c10 0 16 8 22 12 12 4 26 4 36 8-14 4-30 8-44 14-6 3-10 6-12 10l-2 11-2-11c-2-4-6-7-12-10C32 42 16 38 2 34c10-4 24-4 36-8 6-4 12-12 22-12z';

/** La manta raya. En Tinta, en tinta; en Abisal, luminosa. */
export function MantaMark({ width = 30, color }: { width?: number; color?: string }) {
  const palette = useTheme();
  const fill = color ?? (palette.name === 'abisal' ? palette.accent : palette.ink);
  return (
    <View style={!color ? contentGlow(palette, 0.8) : null}>
      <Svg
        width={width}
        height={(width * 70) / 120}
        viewBox="0 0 120 70"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Path d={MANTA_PATH} fill={fill} />
      </Svg>
    </View>
  );
}

export function Wordmark() {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
      accessible
      accessibilityRole="header"
      accessibilityLabel="Manta"
    >
      <MantaMark />
      <Text variant="headline">Manta</Text>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ENSO_R = 66;
const ENSO_LENGTH = 2 * Math.PI * ENSO_R;

/**
 * El ensō: un círculo de una sola pincelada. Con `level` (0 a 1) se dibuja al inhalar
 * y se borra al exhalar; sin `level` queda casi cerrado, como al terminar una clase.
 */
export function Enso({
  size = 160,
  level,
  color,
}: {
  size?: number;
  level?: SharedValue<number>;
  color?: string;
}) {
  const palette = useTheme();
  const ink = color ?? palette.ink;
  const fallback = useSharedValue(0.93);
  const progress = level ?? fallback;

  const mainProps = useAnimatedProps(() => ({
    strokeDashoffset: ENSO_LENGTH * (1 - (0.08 + progress.value * 0.86)),
  }));
  const echoProps = useAnimatedProps(() => ({
    strokeDashoffset: ENSO_LENGTH * (1 - (0.04 + progress.value * 0.8)),
  }));

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      style={{ transform: [{ rotate: '-110deg' }] }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Circle
        cx={80}
        cy={80}
        r={ENSO_R}
        fill="none"
        stroke={ink}
        strokeOpacity={0.07}
        strokeWidth={11}
      />
      <AnimatedCircle
        cx={80}
        cy={80}
        r={ENSO_R}
        fill="none"
        stroke={ink}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${ENSO_LENGTH} ${ENSO_LENGTH}`}
        animatedProps={mainProps}
      />
      <AnimatedCircle
        cx={80}
        cy={80}
        r={ENSO_R - 4.5}
        fill="none"
        stroke={ink}
        strokeOpacity={0.4}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${ENSO_LENGTH} ${ENSO_LENGTH}`}
        animatedProps={echoProps}
      />
    </Svg>
  );
}

/** La manta que se desliza despacio, para momentos de calma (final de clase, pantalla de pago). */
export function GlidingManta({ width = 140, color }: { width?: number; color?: string }) {
  const reducedMotion = useReducedMotion();
  const phase = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    phase.value = withRepeat(
      withTiming(1, { duration: 4_500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [phase, reducedMotion]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -8 + phase.value * 16 },
      { translateY: 4 - phase.value * 10 },
      { rotate: `${-3 + phase.value * 6}deg` },
    ],
  }));
  return (
    <Animated.View style={style}>
      <MantaMark width={width} color={color} />
    </Animated.View>
  );
}
