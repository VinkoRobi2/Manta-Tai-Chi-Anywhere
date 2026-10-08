import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { svgId } from '@/features/onboarding/svgId';

import type { PhotoArt } from './art';

/** Lo que tarda la foto en acercarse (y otro tanto en volver), con `drift`. */
const DRIFT_MS = 14000;

/**
 * Una foto de clase con su encuadre (ver `art.ts`), del tamaño que se le pida.
 * Con `drift`, se acerca y se aleja muy despacio mientras la pantalla se ve, como si respirara.
 */
export function ArtPhoto({
  art,
  width,
  height,
  drift = false,
}: {
  art: PhotoArt;
  width: number;
  height: number;
  drift?: boolean;
}) {
  const { source, size, focus, zoom } = art;
  // La parte de la foto que se ve, en píxeles de la foto: cubre el hueco y se centra en el foco
  // sin salirse de los bordes.
  const aspect = width / height;
  const visibleWidth =
    aspect > size.width / size.height ? size.width / zoom : (size.height / zoom) * aspect;
  const visibleHeight = visibleWidth / aspect;
  const left = clamp(focus.x * size.width - visibleWidth / 2, 0, size.width - visibleWidth);
  const top = clamp(focus.y * size.height - visibleHeight / 2, 0, size.height - visibleHeight);
  const scale = width / visibleWidth;

  const reducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const breath = useSharedValue(0);
  const moving = drift && focused && !reducedMotion;
  useEffect(() => {
    if (!moving) {
      cancelAnimation(breath);
      return;
    }
    breath.value = withRepeat(
      withTiming(1, { duration: DRIFT_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(breath);
  }, [breath, moving]);
  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.06 }],
  }));

  return (
    <View
      style={{ width, height, overflow: 'hidden' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, driftStyle]}>
        <Image
          source={source}
          contentFit="fill"
          transition={250}
          style={{
            position: 'absolute',
            left: -left * scale,
            top: -top * scale,
            width: size.width * scale,
            height: size.height * scale,
          }}
        />
      </Animated.View>
    </View>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Degradado vertical para leer texto blanco sobre una foto. `stops`: posición (0 arriba, 1 abajo)
 * y opacidad del color en ese punto.
 */
export function Scrim({
  stops,
  color = '#000000',
}: {
  stops: readonly (readonly [offset: number, opacity: number])[];
  color?: string;
}) {
  const id = svgId(useId());
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {stops.map(([offset, opacity]) => (
            <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
