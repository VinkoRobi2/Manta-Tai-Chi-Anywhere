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
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { welcome } from '@/theme/tokens';

import { svgId } from './svgId';

/**
 * Fondo de la bienvenida: fotos de personas practicando tai chi, una tras otra. Cada foto se
 * acerca muy despacio (efecto Ken Burns) y se funde con la siguiente, como una respiración larga.
 * Con "Reducir movimiento" se queda la primera foto, quieta. Solo corre mientras se ve.
 */

const PHOTOS = [
  {
    source: require('../../../assets/images/lessons/sentado-primeros-movimientos.jpg'),
    // Hacia dónde se acerca la cámara (el rostro y las manos).
    origin: { x: 0.1, y: -0.12 },
  },
  {
    source: require('../../../assets/images/lessons/en-el-lugar-manos-de-nube.jpg'),
    origin: { x: -0.08, y: -0.1 },
  },
] as const;

/** Lo que dura cada foto en pantalla, y el fundido entre una y otra. */
const HOLD_MS = 7000;
const FADE_MS = 1600;
const ZOOM = 0.1;

export function WelcomeBackdrop({ width, height }: { width: number; height: number }) {
  const reducedMotion = useReducedMotion();
  const scrimId = svgId(useId());
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setRunning(true);
      return () => setRunning(false);
    }, []),
  );

  useEffect(() => {
    if (reducedMotion || !running) return;
    const timer = setInterval(() => setActive((index) => (index + 1) % PHOTOS.length), HOLD_MS);
    return () => clearInterval(timer);
  }, [reducedMotion, running]);

  return (
    <View
      style={{ width, height, overflow: 'hidden', backgroundColor: welcome.ground }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {PHOTOS.map((photo, index) => (
        <Slide
          key={index}
          source={photo.source}
          origin={photo.origin}
          visible={index === active}
          moving={!reducedMotion && running}
          width={width}
          height={height}
        />
      ))}

      {/* Oscurece arriba (la hora y los botones) y un poco abajo, donde empieza la hoja blanca. */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={scrimId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={welcome.ground} stopOpacity={0.5} />
            <Stop offset="0.22" stopColor={welcome.ground} stopOpacity={0} />
            <Stop offset="0.8" stopColor={welcome.ground} stopOpacity={0} />
            <Stop offset="1" stopColor={welcome.ground} stopOpacity={0.25} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${scrimId})`} />
      </Svg>
    </View>
  );
}

function Slide({
  source,
  origin,
  visible,
  moving,
  width,
  height,
}: {
  source: number;
  origin: { x: number; y: number };
  visible: boolean;
  moving: boolean;
  width: number;
  height: number;
}) {
  const opacity = useSharedValue(visible ? 1 : 0);
  const zoom = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: FADE_MS,
      easing: Easing.inOut(Easing.quad),
    });
    if (visible && moving) {
      // Cada vez que vuelve a verse, el acercamiento empieza de nuevo.
      zoom.value = 0;
      zoom.value = withTiming(1, { duration: HOLD_MS + FADE_MS, easing: Easing.linear });
    }
    if (!moving) cancelAnimation(zoom);
  }, [moving, opacity, visible, zoom]);

  const style = useAnimatedStyle(() => {
    const scale = 1 + ZOOM * zoom.value;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: origin.x * width * ZOOM * zoom.value },
        { translateY: origin.y * height * ZOOM * zoom.value },
        { scale },
      ],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Image
        source={source}
        contentFit="cover"
        contentPosition="top center"
        style={{ width, height }}
        transition={0}
      />
    </Animated.View>
  );
}
