import { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { welcome } from '@/theme/tokens';
import { Text } from '@/ui/Text';

import { FADE_MS, PhotoSlides, PRACTICE_PHOTOS, usePhotoCycle } from './PhotoSlides';
import { svgId } from './svgId';

/**
 * Fondo de la bienvenida: las dos fotos de tai chi (sentada y de pie), una tras otra, con su
 * etiqueta y en cuál vamos. Ver `PhotoSlides`.
 */

const PHOTOS = [
  { caption: 'seated', ...PRACTICE_PHOTOS.seated },
  { caption: 'standing', ...PRACTICE_PHOTOS.standing },
] as const;

export function WelcomeBackdrop({
  width,
  height,
  gutter,
  bottomInset,
}: {
  width: number;
  height: number;
  /** Margen lateral de la pantalla, para alinear la etiqueta con el texto. */
  gutter: number;
  /** Lo que tapa la hoja blanca abajo: la etiqueta va justo encima. */
  bottomInset: number;
}) {
  const { t } = useTranslation();
  const palette = welcome;
  const scrimId = svgId(useId());
  const { active, moving } = usePhotoCycle(PHOTOS.length);

  return (
    <View
      style={{ width, height, overflow: 'hidden', backgroundColor: welcome.ground }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <PhotoSlides photos={PHOTOS} active={active} moving={moving} width={width} height={height} />

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

      {/* Qué se ve en la foto, y en cuál de las dos fotos vamos. */}
      <View
        style={{
          position: 'absolute',
          left: gutter,
          right: gutter,
          bottom: bottomInset + 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Animated.View
          key={active}
          entering={FadeIn.duration(FADE_MS)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 32,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.38)',
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.sol }} />
          <Text weight="medium" color={palette.ink} style={{ fontSize: 13, lineHeight: 16 }}>
            {t(`onboarding.welcomeCaption.${PHOTOS[active]!.caption}`)}
          </Text>
        </Animated.View>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {PHOTOS.map((photo, index) => (
            <Dash key={photo.caption} active={index === active} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Dash({ active }: { active: boolean }) {
  const grow = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    grow.value = withTiming(active ? 1 : 0, { duration: 400 });
  }, [active, grow]);
  const style = useAnimatedStyle(() => ({
    width: 8 + grow.value * 14,
    opacity: 0.45 + grow.value * 0.55,
  }));
  return (
    <Animated.View style={[{ height: 4, borderRadius: 2, backgroundColor: welcome.ink }, style]} />
  );
}
