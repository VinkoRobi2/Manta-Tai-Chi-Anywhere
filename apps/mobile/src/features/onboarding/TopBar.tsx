import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ChevronLeftGlyph } from './OptionIcons';
import { useOnboardingPalette } from './responsive';
import { Squish } from './Squish';

const BUTTON = 44;

/** Volver: un círculo gris con la flecha. */
export function BackButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  return (
    <Squish
      onPress={onPress}
      accessibilityLabel={t('onboarding.back')}
      hitSlop={6}
      style={{
        width: BUTTON,
        height: BUTTON,
        borderRadius: BUTTON / 2,
        backgroundColor: palette.card,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ChevronLeftGlyph color={palette.ink} size={20} />
    </Squish>
  );
}

/**
 * Barra superior de cada pregunta: volver, la barra de progreso y, si hace falta, "Saltar".
 * La barra se llena desde el paso anterior hasta el actual al entrar a la pantalla.
 */
export function TopBar({
  step,
  total,
  right,
  progressLabel,
  onBack,
}: {
  step: number;
  total: number;
  right?: ReactNode;
  progressLabel: string;
  onBack: () => void;
}) {
  const palette = useOnboardingPalette();
  const [trackWidth, setTrackWidth] = useState(0);
  const filled = useSharedValue((step - 1) / total);
  useEffect(() => {
    filled.value = withTiming(step / total, {
      duration: 520,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [filled, step, total]);
  const fill = useAnimatedStyle(() => ({ width: trackWidth * filled.value }));

  return (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <BackButton onPress={onBack} />
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={progressLabel}
        accessibilityValue={{ min: 0, max: total, now: step }}
        onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          backgroundColor: palette.track,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[{ height: 6, borderRadius: 3, backgroundColor: palette.selected }, fill]}
        />
      </View>
      <View style={{ minWidth: BUTTON, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
