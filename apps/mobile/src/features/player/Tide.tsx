import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { stage } from '@/theme/tokens';

/** Fondo del escenario: azul profundo con luz desde arriba. */
export function StageBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="stage" cx="50%" cy="34%" rx="80%" ry="62%">
          <Stop offset="0" stopColor={stage.top} />
          <Stop offset="0.48" stopColor={stage.middle} />
          <Stop offset="1" stopColor={stage.bottom} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={100} fill="url(#stage)" />
    </Svg>
  );
}

/**
 * La marea: el nivel del agua sube al inhalar y baja al exhalar.
 * `level` va de 0 (marea baja) a 1 (marea alta) y lo anima el reproductor.
 */
export function Tide({
  level,
  restTop,
  rise,
}: {
  level: SharedValue<number>;
  restTop: number;
  rise: number;
}) {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const drift = useSharedValue(0);

  // La ola se desliza despacio hacia la derecha, sin fin: el patrón se repite cada `width`.
  // La franja mide tres anchos y empieza un ancho antes, así siempre cubre la pantalla.
  useEffect(() => {
    if (reducedMotion) return;
    drift.value = withRepeat(
      withTiming(width, { duration: 14_000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(drift);
  }, [drift, reducedMotion, width]);

  const waterStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -level.value * rise }] }));
  const waveStyle = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value }] }));

  const period = width / 2;
  let d = `M0 10`;
  for (let x = 0; x < width * 3; x += period) {
    d += ` Q ${x + period / 4} 2 ${x + period / 2} 10 T ${x + period} 10`;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, right: 0, top: restTop, height: 900 }, waterStyle]}
    >
      <Animated.View
        style={[
          { position: 'absolute', top: -10, left: -width, width: width * 3, height: 20 },
          waveStyle,
        ]}
      >
        <Svg width={width * 3} height={20}>
          <Path d={`${d} V20 H0 Z`} fill={stage.water} />
          <Path d={d} fill="none" stroke={stage.foam} strokeWidth={1.6} />
        </Svg>
      </Animated.View>
      <View style={{ position: 'absolute', top: 10, left: 0, right: 0, bottom: 0 }}>
        <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 100">
          <Defs>
            <LinearGradient id="deep" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#1F7A8C" stopOpacity={0.42} />
              <Stop offset="0.45" stopColor="#06232B" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={10} height={100} fill="url(#deep)" />
        </Svg>
      </View>
    </Animated.View>
  );
}
