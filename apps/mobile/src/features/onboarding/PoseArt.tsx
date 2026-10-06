import { Image } from 'expo-image';
import { useEffect, useId, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import type { CareTag } from '@/features/settings/settings';
import { motion } from '@/theme/tokens';

import { useOnboardingPalette } from './responsive';
import { svgId } from './svgId';

/**
 * La imagen grande de cada paso: una silueta de tai chi, un sol detrás y su sombra en el suelo.
 * Mide el espacio que le queda en la pantalla (como una container query) y se ajusta a él.
 *
 * Las siluetas son PNG negros con fondo transparente; se tiñen con el color de tinta.
 * El lienzo de cada PNG mide 60 × 104 unidades:
 * x = 0 en la unidad 30 y los pies en la unidad 100 (más 2 de margen arriba).
 */

export type Pose = 'standing' | 'seated' | 'rise';
export type ZoneMarker = Exclude<CareTag, 'wrists'>;

export const POSES: Record<Pose, { source: number; centerUnit: number; chestUnit: number }> = {
  standing: {
    source: require('../../../assets/images/onboarding/pose-standing.png'),
    centerUnit: 0,
    chestUnit: 35,
  },
  seated: {
    source: require('../../../assets/images/onboarding/pose-seated.png'),
    centerUnit: 6.5,
    chestUnit: 52,
  },
  rise: {
    source: require('../../../assets/images/onboarding/pose-rise.png'),
    centerUnit: 7,
    chestUnit: 35,
  },
};

/** Dónde está cada zona en la silueta de pie, en unidades del lienzo. */
const ZONES: Record<ZoneMarker, readonly (readonly [number, number])[]> = {
  neck: [[1, 16]],
  shoulders: [[2.5, 24]],
  back: [[-6.2, 38]],
  knees: [
    [15.6, 72],
    [-12.6, 75.6],
  ],
};

export const IMAGE_UNITS_W = 60;
export const IMAGE_UNITS_H = 104;
export const FEET_UNIT = 102;
/** Si queda menos alto que esto, la figura no se dibuja: así nunca tapa las opciones. */
const MIN_BOX_HEIGHT = 100;

export type Backdrop = { kind: 'disc' } | { kind: 'ring'; progress: number };

export interface PoseArtProps {
  /** Una o dos figuras. */
  poses: readonly Pose[];
  backdrop?: Backdrop;
  /** Zonas a marcar sobre la figura de pie. */
  markers?: readonly ZoneMarker[];
  maxHeight: number;
}

export function PoseArt({
  poses,
  backdrop = { kind: 'disc' },
  markers = [],
  maxHeight,
}: PoseArtProps) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((current) =>
      current.width === width && current.height === height ? current : { width, height },
    );
  };

  return (
    <View
      style={{ flex: 1 }}
      onLayout={onLayout}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {box.width > 0 && box.height >= MIN_BOX_HEIGHT ? (
        <Scene
          width={box.width}
          height={box.height}
          poses={poses}
          backdrop={backdrop}
          markers={markers}
          maxHeight={maxHeight}
        />
      ) : null}
    </View>
  );
}

interface Placed {
  pose: Pose;
  left: number;
  top: number;
  height: number;
}

function Scene({
  width,
  height,
  poses,
  backdrop,
  markers,
  maxHeight,
}: Required<PoseArtProps> & { width: number; height: number }) {
  const palette = useOnboardingPalette();
  const floorGap = 14;
  const feetY = height - floorGap;
  const figH = Math.max(80, Math.min(maxHeight, height - floorGap - 4, width * 1.25));
  const cx = width / 2;
  const pair = poses.length > 1;

  const placed: Placed[] = poses.map((pose, index) => {
    const h = pair ? figH * 0.86 : figH;
    const u = h / IMAGE_UNITS_H;
    const center = pair ? cx + (index === 0 ? -0.3 : 0.3) * figH : cx;
    return {
      pose,
      height: h,
      left: center - (IMAGE_UNITS_W / 2 + POSES[pose].centerUnit) * u,
      top: feetY - FEET_UNIT * u,
    };
  });

  const main = placed[0]!;
  const mainU = main.height / IMAGE_UNITS_H;
  const chestY = main.top + (POSES[main.pose].chestUnit + 2) * mainU;
  const discSize = figH * (backdrop.kind === 'ring' ? 0.86 : 0.74);
  const discTop = Math.max(0, chestY - discSize / 2);
  const shadowW = pair ? figH * 1.15 : figH * 0.72;
  const shadowH = Math.max(14, figH * 0.06);

  return (
    <>
      {backdrop.kind === 'ring' ? (
        <View style={{ position: 'absolute', left: cx - discSize / 2, top: discTop }}>
          <Ring
            size={discSize}
            stroke={Math.max(10, figH * 0.05)}
            progress={backdrop.progress}
            track={palette.track}
            color={palette.accent}
          />
        </View>
      ) : (
        <View
          style={{
            position: 'absolute',
            left: cx - discSize / 2,
            top: discTop,
            width: discSize,
            height: discSize,
            borderRadius: discSize / 2,
            backgroundColor: palette.accent,
          }}
        />
      )}

      <FloorShadow
        left={cx - shadowW / 2}
        top={feetY - shadowH / 2}
        width={shadowW}
        height={shadowH}
        color={palette.shadow}
        opacity={palette.shadowOpacity}
      />

      <Animated.View
        key={poses.join('-')}
        entering={FadeIn.duration(motion.quick)}
        style={{ position: 'absolute', left: 0, top: 0, width, height }}
      >
        {placed.map((figure) => (
          <Image
            key={figure.pose}
            source={POSES[figure.pose].source}
            tintColor={palette.ink}
            contentFit="contain"
            style={{
              position: 'absolute',
              left: figure.left,
              top: figure.top,
              width: (figure.height * IMAGE_UNITS_W) / IMAGE_UNITS_H,
              height: figure.height,
            }}
          />
        ))}
      </Animated.View>

      {main.pose === 'standing' && !pair
        ? markers.flatMap((zone) =>
            ZONES[zone].map(([ux, uy], index) => (
              <ZoneDot
                key={`${zone}-${index}`}
                x={main.left + (ux + IMAGE_UNITS_W / 2) * mainU}
                y={main.top + (uy + 2) * mainU}
                scale={figH / 220}
                color={palette.accent}
                ring={palette.background}
              />
            )),
          )
        : null}
    </>
  );
}

function FloorShadow({
  left,
  top,
  width,
  height,
  color,
  opacity,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}) {
  const id = svgId(useId());
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left, top }}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="0.7" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

function ZoneDot({
  x,
  y,
  scale,
  color,
  ring,
}: {
  x: number;
  y: number;
  scale: number;
  color: string;
  ring: string;
}) {
  const halo = 30 * scale;
  const dot = 14 * scale;
  return (
    <Animated.View
      entering={ZoomIn.duration(motion.quick)}
      style={{
        position: 'absolute',
        left: x - halo / 2,
        top: y - halo / 2,
        width: halo,
        height: halo,
      }}
    >
      <View
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: halo / 2,
          backgroundColor: color,
          opacity: 0.3,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: (halo - dot) / 2,
          top: (halo - dot) / 2,
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          borderWidth: Math.max(2, 3 * scale),
          borderColor: ring,
          backgroundColor: color,
        }}
      />
    </Animated.View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Anillo de progreso. Por defecto anima los cambios; con `immediate` sigue el valor tal cual
 * (cuando quien lo usa ya lo anima, como la pantalla "Creando tu plan").
 */
export function Ring({
  size,
  stroke,
  progress,
  track,
  color,
  immediate = false,
}: {
  size: number;
  stroke: number;
  progress: number;
  track: string;
  color: string;
  immediate?: boolean;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = useSharedValue(progress);
  useEffect(() => {
    filled.value = immediate ? progress : withTiming(progress, { duration: motion.calm });
  }, [filled, immediate, progress]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - filled.value),
  }));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        animatedProps={animatedProps}
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}
