import { Image, type ImageContentPosition } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SEATED_PHOTO, STANDING_PHOTO } from '@/features/catalog/art';
import type { PracticeMode } from '@/features/settings/settings';

/**
 * Las fotos de tai chi de la app (sentada y de pie) y cómo se muestran: cada foto se acerca muy
 * despacio (efecto Ken Burns) y se funde con la siguiente, como una respiración larga.
 * Con "Reducir movimiento" se queda la primera foto, quieta. Solo corre mientras se ve.
 */

export interface PracticePhoto {
  source: number;
  /** Hacia dónde se acerca la cámara (el rostro y las manos), en fracciones del tamaño. */
  origin: { x: number; y: number };
}

export const PRACTICE_PHOTOS = {
  seated: { source: SEATED_PHOTO, origin: { x: 0.1, y: -0.12 } },
  standing: { source: STANDING_PHOTO, origin: { x: -0.08, y: -0.1 } },
} as const satisfies Record<Exclude<PracticeMode, 'both'>, PracticePhoto>;

/** Lo que dura cada foto en pantalla, y el fundido entre una y otra. */
const HOLD_MS = 7000;
export const FADE_MS = 1600;
const ZOOM = 0.1;

/** Qué foto toca y si las fotos se mueven. Pasa a la siguiente cada 7 s mientras se ve. */
export function usePhotoCycle(count: number): { active: number; moving: boolean } {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setRunning(true);
      return () => setRunning(false);
    }, []),
  );

  useEffect(() => {
    if (reducedMotion || !running || count < 2) return;
    const timer = setInterval(() => setActive((index) => (index + 1) % count), HOLD_MS);
    return () => clearInterval(timer);
  }, [count, reducedMotion, running]);

  return { active: active % count, moving: !reducedMotion && running };
}

/** Las fotos apiladas; se ve la `active`. Ocupan `width` × `height`. */
export function PhotoSlides({
  photos,
  active,
  moving,
  width,
  height,
  contentPosition = 'top center',
}: {
  photos: readonly PracticePhoto[];
  active: number;
  moving: boolean;
  width: number;
  height: number;
  contentPosition?: ImageContentPosition;
}) {
  return (
    <>
      {photos.map((photo, index) => (
        <Slide
          key={index}
          photo={photo}
          visible={index === active}
          moving={moving}
          width={width}
          height={height}
          contentPosition={contentPosition}
        />
      ))}
    </>
  );
}

function Slide({
  photo,
  visible,
  moving,
  width,
  height,
  contentPosition,
}: {
  photo: PracticePhoto;
  visible: boolean;
  moving: boolean;
  width: number;
  height: number;
  contentPosition: ImageContentPosition;
}) {
  const opacity = useSharedValue(visible ? 1 : 0);
  const zoom = useSharedValue(0);
  const { origin } = photo;

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
        source={photo.source}
        contentFit="cover"
        contentPosition={contentPosition}
        style={{ width, height }}
        transition={0}
      />
    </Animated.View>
  );
}
