import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { welcome } from '@/theme/tokens';

import { svgId } from './svgId';

/**
 * Fondo de la bienvenida: una mujer practicando al aire libre, en video, en bucle y sin sonido.
 * El bucle va y vuelve (baja el brazo y lo sube), así no se nota dónde empieza.
 * Mientras carga se ve el primer cuadro como foto, y con "Reducir movimiento" se queda así.
 * El video solo corre mientras la bienvenida está a la vista.
 */

const VIDEO = require('../../../assets/videos/welcome.mp4');
const POSTER = require('../../../assets/images/onboarding/welcome-poster.jpg');
const VIDEO_W = 1280;
const VIDEO_H = 720;
/** Dónde está la persona en el cuadro (fracción del ancho): el recorte la mantiene a la vista. */
const FOCUS_X = 0.74;

/** Llena una caja de `width` × `height` (la parte de arriba de la bienvenida). */
export function WelcomeBackdrop({ width, height }: { width: number; height: number }) {
  const reducedMotion = useReducedMotion();
  const scrimId = svgId(useId());

  // "cover" con punto de interés: llena la caja sin deformarse y deja a la persona a la vista.
  const scale = Math.max(width / VIDEO_W, height / VIDEO_H);
  const w = VIDEO_W * scale;
  const h = VIDEO_H * scale;
  const left = Math.min(0, Math.max(width - w, width / 2 - FOCUS_X * w));
  const top = (height - h) / 2;
  const frame = { position: 'absolute', left, top, width: w, height: h } as const;

  const player = useVideoPlayer(reducedMotion ? null : VIDEO, (created) => {
    created.loop = true;
    created.muted = true;
    // No corta la música de la persona.
    created.audioMixingMode = 'mixWithOthers';
  });

  useFocusEffect(
    useCallback(() => {
      if (reducedMotion) return;
      player.play();
      return () => player.pause();
    }, [player, reducedMotion]),
  );

  // El video aparece encima de la foto cuando ya tiene imagen: sin parpadeo negro.
  const shown = useSharedValue(0);
  const videoStyle = useAnimatedStyle(() => ({ opacity: shown.value }));

  return (
    <View
      style={{ width, height, overflow: 'hidden', backgroundColor: welcome.ground }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image source={POSTER} style={frame} contentFit="cover" />
      {reducedMotion ? null : (
        <Animated.View style={[frame, videoStyle]}>
          <VideoView
            player={player}
            style={{ width: w, height: h }}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
            playsInline
            // Android: textureView se deja tapar por la hoja blanca con esquinas redondas.
            surfaceType="textureView"
            onFirstFrameRender={() => shown.set(withTiming(1, { duration: 500 }))}
          />
        </Animated.View>
      )}

      {/* Oscurece un poco arriba para que se lean la hora y "Ya tengo cuenta". */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={scrimId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={welcome.ground} stopOpacity={0.45} />
            <Stop offset="0.24" stopColor={welcome.ground} stopOpacity={0} />
            <Stop offset="1" stopColor={welcome.ground} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${scrimId})`} />
      </Svg>
    </View>
  );
}
