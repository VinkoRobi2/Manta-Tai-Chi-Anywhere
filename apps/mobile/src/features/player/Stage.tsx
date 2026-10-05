import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/theme';
import { glowShadow } from '@/theme/tokens';
import { Enso } from '@/ui/Brand';

/** Fondo del reproductor: papel en Tinta, mar profundo con plancton en Abisal. */
export function StageBackground() {
  const palette = useTheme();
  if (palette.name === 'tinta') {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.background }]} />;
  }
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
        <RadialGradient id="escenario" cx="50%" cy="68%" rx="90%" ry="50%">
          <Stop offset="0" stopColor={palette.stage.top} />
          <Stop offset="0.55" stopColor={palette.stage.middle} />
          <Stop offset="1" stopColor={palette.stage.bottom} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={100} fill="url(#escenario)" />
      <Circle cx={8} cy={62} r={0.45} fill="#8BF5C8" opacity={0.6} />
      <Circle cx={92} cy={71} r={0.5} fill="#5FE3E8" opacity={0.6} />
      <Circle cx={18} cy={82} r={0.35} fill="#5FE3E8" opacity={0.5} />
      <Circle cx={85} cy={56} r={0.3} fill="#8BF5C8" opacity={0.5} />
    </Svg>
  );
}

const GUIDE = 168;

/**
 * La guía de respiración. `level` va de 0 (exhalado) a 1 (inhalado) y lo anima el reproductor.
 * Tinta: un ensō que se dibuja al inhalar y se borra al exhalar.
 * Abisal: un anillo de luz que se expande al inhalar y se recoge al exhalar.
 */
export function BreathGuide({
  level,
  children,
}: {
  level: SharedValue<number>;
  children?: ReactNode;
}) {
  const palette = useTheme();

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.72 + level.value * 0.36 }],
    opacity: 0.55 + level.value * 0.45,
  }));

  return (
    <View style={{ width: GUIDE, height: GUIDE, alignItems: 'center', justifyContent: 'center' }}>
      {palette.name === 'tinta' ? (
        <View style={StyleSheet.absoluteFill}>
          <Enso size={GUIDE} level={level} />
        </View>
      ) : (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: GUIDE / 2,
              borderWidth: 2,
              borderColor: palette.accent,
              backgroundColor: 'rgba(95,227,232,0.05)',
            },
            glowShadow(palette, 0.7),
            ringStyle,
          ]}
        />
      )}
      {children}
    </View>
  );
}
