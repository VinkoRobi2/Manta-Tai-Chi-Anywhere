import { Image } from 'expo-image';
import { View } from 'react-native';

import { FEET_UNIT, IMAGE_UNITS_H, IMAGE_UNITS_W, POSES, type Pose } from './PoseArt';

/**
 * Ilustración pequeña para tarjetas: el sol y la silueta "de pie" sobre el borde inferior,
 * recortada por la tarjeta. Se tiñe con el color que toque (negra, o blanca sobre negro).
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
}) {
  const pair = poses.length > 1;
  const h = pair ? figureHeight * 0.84 : figureHeight;
  const u = h / IMAGE_UNITS_H;
  // Los pies tocan el borde inferior de la tarjeta.
  const top = height - FEET_UNIT * u + u * 1.5;

  return (
    <View
      style={{ width, height, overflow: 'hidden' }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={{
          position: 'absolute',
          left: (width - sunSize) / 2,
          top: (height - sunSize) / 2 + sunOffsetY,
          width: sunSize,
          height: sunSize,
          borderRadius: sunSize / 2,
          backgroundColor: sunColor,
        }}
      />
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
    </View>
  );
}
