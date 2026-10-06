import { Image } from 'expo-image';
import { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { welcome } from '@/theme/tokens';

import { svgId } from './svgId';

/**
 * Fondo de la bienvenida: amanecer entre montañas con niebla y una persona practicando.
 * Se mueve como un video en cámara lenta: acercamiento muy lento, el sol que respira y
 * dos bancos de niebla que pasan. Con "Reducir movimiento" activado queda quieto.
 * Cuando exista el video del instructor, se reemplaza la imagen por un VideoView en bucle.
 */

const SOURCE = require('../../../assets/images/onboarding/welcome.jpg');
const IMAGE_W = 1800;
const IMAGE_H = 2700;
/** Posición del sol en la imagen (fracciones). */
const SUN = { x: 0.44, y: 0.392 };

function useLoop(duration: number, enabled: boolean) {
  const value = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return;
    value.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [duration, enabled, value]);
  return value;
}

/** Llena una caja de `width` × `height` (la parte de arriba de la bienvenida). */
export function WelcomeBackdrop({ width, height }: { width: number; height: number }) {
  const reducedMotion = useReducedMotion();
  const ids = {
    glow: svgId(useId()),
    mistA: svgId(useId()),
    mistB: svgId(useId()),
    scrim: svgId(useId()),
  };

  // "cover": la imagen llena la caja sin deformarse, centrada.
  const scale = Math.max(width / IMAGE_W, height / IMAGE_H);
  const w = IMAGE_W * scale;
  const h = IMAGE_H * scale;
  const left = (width - w) / 2;
  const top = (height - h) / 2;

  const zoom = useLoop(26_000, !reducedMotion);
  const breath = useLoop(4_000, !reducedMotion);
  const driftA = useLoop(38_000, !reducedMotion);
  const driftB = useLoop(30_000, !reducedMotion);

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + zoom.value * 0.09 }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + breath.value * 0.45,
    transform: [{ scale: 0.92 + breath.value * 0.16 }],
  }));

  const glowSize = w * 0.78;
  const mistW = w * 2;

  return (
    <View
      style={{ width, height, overflow: 'hidden', backgroundColor: welcome.ground }}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          { position: 'absolute', left, top, width: w, height: h, transformOrigin: '58% 48%' },
          zoomStyle,
        ]}
      >
        <Image
          source={SOURCE}
          style={{ width: w, height: h }}
          contentFit="cover"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: SUN.x * w - glowSize / 2,
              top: SUN.y * h - glowSize / 2,
              width: glowSize,
              height: glowSize,
            },
            glowStyle,
          ]}
        >
          <Svg width={glowSize} height={glowSize}>
            <Defs>
              <RadialGradient id={ids.glow} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={welcome.glow} stopOpacity={0.45} />
                <Stop offset="0.38" stopColor={welcome.glow} stopOpacity={0.14} />
                <Stop offset="0.7" stopColor={welcome.glow} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width={glowSize} height={glowSize} fill={`url(#${ids.glow})`} />
          </Svg>
        </Animated.View>
        <Mist
          id={ids.mistA}
          drift={driftA}
          from={-60}
          to={90}
          left={-w * 0.5}
          top={h * 0.405}
          width={mistW}
          height={h * 0.05}
          color={welcome.mist}
          opacity={0.2}
        />
        <Mist
          id={ids.mistB}
          drift={driftB}
          from={90}
          to={-60}
          left={-w * 0.4}
          top={h * 0.475}
          width={mistW * 0.9}
          height={h * 0.04}
          color={welcome.ink}
          opacity={0.12}
        />
      </Animated.View>

      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={ids.scrim} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={welcome.ground} stopOpacity={0.45} />
            <Stop offset="0.24" stopColor={welcome.ground} stopOpacity={0} />
            <Stop offset="1" stopColor={welcome.ground} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${ids.scrim})`} />
      </Svg>
    </View>
  );
}

function Mist({
  id,
  drift,
  from,
  to,
  left,
  top,
  width,
  height,
  color,
  opacity,
}: {
  id: string;
  /** 0 → 1 en bucle: la niebla va de `from` a `to` píxeles. */
  drift: SharedValue<number>;
  from: number;
  to: number;
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: from + drift.value * (to - from) }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left, top, width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="0.7" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={`url(#${id})`}
        />
      </Svg>
    </Animated.View>
  );
}
