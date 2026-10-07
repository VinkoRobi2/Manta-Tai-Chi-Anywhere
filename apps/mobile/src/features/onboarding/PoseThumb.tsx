import { Image } from 'expo-image';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useBreath } from './motion';
import { FEET_UNIT, IMAGE_UNITS_H, IMAGE_UNITS_W, POSES, type Pose } from './PoseArt';

/**
 * Ilustración pequeña para tarjetas: el sol y la silueta "de pie" sobre el borde inferior,
 * recortada por la tarjeta. Se tiñe con el color que toque (negra, o blanca sobre negro).
 *
 * - `alive`: el sol respira y la figura se mece apenas (la opción elegida, el plan).
 * - `rise`: al aparecer, el sol sube desde abajo como un amanecer y después la figura se asoma.
 */
export function PoseThumb({
  poses,
  width,
  height,
  figureHeight,
  sunSize,
  sunColor,
  tint,
  sunOffsetY = 0,
  alive = false,
  rise = false,
}: {
  poses: readonly Pose[];
  width: number;
  height: number;
  /** Alto de la silueta a escala de persona de pie (las sentadas se ven más bajas). */
  figureHeight: number;
  sunSize: number;
  sunColor: string;
  tint: string;
  /** Mueve el sol hacia arriba (negativo) o abajo. */
  sunOffsetY?: number;
  alive?: boolean;
  rise?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const pair = poses.length > 1;
  const h = pair ? figureHeight * 0.84 : figureHeight;
  const u = h / IMAGE_UNITS_H;
  // Los pies tocan el borde inferior de la tarjeta.
  const top = height - FEET_UNIT * u + u * 1.5;

  const breath = useBreath({ active: alive });
  const dawn = useSharedValue(rise && !reducedMotion ? 0 : 1);
  const figureIn = useSharedValue(rise && !reducedMotion ? 0 : 1);
  useEffect(() => {
    if (!rise || reducedMotion) return;
    dawn.value = withDelay(150, withSpring(1, { damping: 16, stiffness: 70, mass: 1 }));
    figureIn.value = withDelay(
      650,
      withTiming(1, { duration: 700, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
    );
  }, [dawn, figureIn, reducedMotion, rise]);

  const sunStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, dawn.value * 1.6),
    transform: [
      { translateY: (1 - dawn.value) * sunSize * 0.9 },
      { scale: (alive ? 0.94 + breath.value * 0.08 : 1) * (0.8 + dawn.value * 0.2) },
    ],
  }));
  const figureStyle = useAnimatedStyle(() => ({
    opacity: figureIn.value,
    transform: [{ translateY: (1 - figureIn.value) * 12 - breath.value * u * 1.2 }],
  }));

  return (
    <View
      style={{ width, height, overflow: 'hidden' }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: (width - sunSize) / 2,
            top: (height - sunSize) / 2 + sunOffsetY,
            width: sunSize,
            height: sunSize,
            borderRadius: sunSize / 2,
            backgroundColor: sunColor,
          },
          sunStyle,
        ]}
      />
      <Animated.View
        style={[{ position: 'absolute', left: 0, top: 0, width, height }, figureStyle]}
      >
        {poses.map((pose, index) => {
          const center = pair ? width / 2 + (index === 0 ? -0.24 : 0.26) * figureHeight : width / 2;
          return (
            <Image
              key={pose}
              source={POSES[pose].source}
              tintColor={tint}
              contentFit="contain"
              style={{
                position: 'absolute',
                left: center - (IMAGE_UNITS_W / 2 + POSES[pose].centerUnit) * u,
                top,
                width: IMAGE_UNITS_W * u,
                height: h,
              }}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}
