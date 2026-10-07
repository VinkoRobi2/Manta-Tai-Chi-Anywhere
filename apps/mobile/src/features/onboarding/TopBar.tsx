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
 * Barra superior de cada pregunta: volver, el progreso por tramos (uno por pregunta) y, si hace
 * falta, "Saltar". Los tramos hechos van en negro; el de la pregunta actual se llena al entrar.
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
  return (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <BackButton onPress={onBack} />
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={progressLabel}
        accessibilityValue={{ min: 0, max: total, now: step }}
        style={{ flex: 1, flexDirection: 'row', gap: 5 }}
      >
        {Array.from({ length: total }, (_, index) => (
          <Segment
            key={index}
            state={index + 1 < step ? 'done' : index + 1 === step ? 'current' : 'next'}
          />
        ))}
      </View>
      <View style={{ minWidth: BUTTON, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

function Segment({ state }: { state: 'done' | 'current' | 'next' }) {
  const palette = useOnboardingPalette();
  const [width, setWidth] = useState(0);
  const filled = useSharedValue(state === 'done' ? 1 : 0);
  useEffect(() => {
    filled.value = withTiming(state === 'next' ? 0 : 1, {
      duration: state === 'current' ? 700 : 0,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [filled, state]);
  const fill = useAnimatedStyle(() => ({ width: width * filled.value }));
  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={{
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: palette.track,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            height: 6,
            borderRadius: 3,
            backgroundColor: state === 'current' ? palette.accent : palette.selected,
          },
          fill,
        ]}
      />
    </View>
  );
}
