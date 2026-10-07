import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DAILY_MINUTES, type DailyMinutes } from '@/features/settings/settings';
import { tapFeedback } from '@/lib/haptics';
import { fonts, motion } from '@/theme/tokens';
import { Text } from '@/ui/Text';

import { useBreath } from './motion';
import { RECOMMENDED_MINUTES } from './onboarding';
import { Ring } from './PoseArt';
import { useOnboardingLayout, useOnboardingPalette } from './responsive';

const LONGEST = DAILY_MINUTES[DAILY_MINUTES.length - 1];

/**
 * El número grande dentro del anillo del sol: el anillo se llena con los minutos (20 = vuelta).
 * Una bolita de sol recorre el borde hasta el valor, el centro respira y el número cuenta.
 */
export function MinutesDial({ minutes, size }: { minutes: DailyMinutes; size: number }) {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  const reducedMotion = useReducedMotion();
  const stroke = Math.max(10, size * 0.05);
  const head = stroke * 2.1;
  const progress = useSharedValue(minutes / LONGEST);
  useEffect(() => {
    progress.value = reducedMotion
      ? minutes / LONGEST
      : withTiming(minutes / LONGEST, { duration: motion.calm });
  }, [minutes, progress, reducedMotion]);
  const headStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 360}deg` }],
  }));
  const breath = useBreath();
  const coreStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + breath.value * 0.1,
    transform: [{ scale: 0.86 + breath.value * 0.08 }],
  }));
  const shown = useCountUp(minutes, reducedMotion ? 0 : 420);

  return (
    <View
      style={{ width: size, height: size, alignSelf: 'center' }}
      accessible
      accessibilityLabel={t('onboarding.time.option', { count: minutes })}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: size * 0.14,
            top: size * 0.14,
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: size * 0.36,
            backgroundColor: palette.accent,
          },
          coreStyle,
        ]}
      />
      <Ring
        size={size}
        stroke={stroke}
        progress={minutes / LONGEST}
        track={palette.track}
        color={palette.accent}
      />
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, headStyle]}
      >
        <View
          style={{
            position: 'absolute',
            left: size / 2 - head / 2,
            top: stroke / 2 - head / 2,
            width: head,
            height: head,
            borderRadius: head / 2,
            backgroundColor: palette.accent,
            borderWidth: Math.max(3, stroke * 0.35),
            borderColor: palette.background,
          }}
        />
      </Animated.View>
      <View
        style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text
          color={palette.ink}
          maxFontSizeMultiplier={1}
          style={{
            fontFamily: fonts.semibold,
            fontSize: size * 0.36,
            lineHeight: size * 0.42,
            letterSpacing: -size * 0.012,
            textAlign: 'center',
            fontVariant: ['tabular-nums'],
          }}
        >
          {shown}
        </Text>
        <Text
          color={palette.muted}
          maxFontSizeMultiplier={1.3}
          style={{ fontSize: size * 0.065, lineHeight: size * 0.085 }}
        >
          {t('onboarding.time.perDay')}
        </Text>
      </View>
    </View>
  );
}

/** Cuenta del valor anterior al nuevo en `durationMs` (sin animación si es 0). */
function useCountUp(target: number, durationMs: number): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    from.current = target;
    if (durationMs === 0 || start === target) {
      setShown(target);
      return;
    }
    const began = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - began) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(start + (target - start) * eased));
      if (t >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [durationMs, target]);
  return shown;
}

/** Selector de 5 / 10 / 20 min: una píldora negra que se desliza bajo la opción elegida. */
export function MinutesSegmented({
  value,
  onChange,
}: {
  value: DailyMinutes;
  onChange: (minutes: DailyMinutes) => void;
}) {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  const layout = useOnboardingLayout();
  const height = layout.breakpoint === 'tablet' ? 64 : layout.breakpoint === 'compact' ? 50 : 56;
  const pad = 4;
  const [width, setWidth] = useState(0);
  const segment = width > 0 ? (width - pad * 2) / DAILY_MINUTES.length : 0;
  const index = DAILY_MINUTES.indexOf(value);
  const offset = useSharedValue(index * segment);
  useEffect(() => {
    offset.value = withSpring(index * segment, { damping: 20, stiffness: 260, mass: 0.7 });
  }, [index, offset, segment]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          marginBottom: 10,
          paddingHorizontal: 10,
          height: 24,
          borderRadius: 12,
          backgroundColor: palette.accent,
          justifyContent: 'center',
        }}
      >
        <Text
          variant="caption"
          weight="semibold"
          color={palette.onAccent}
          style={{ fontSize: 12, lineHeight: 16 }}
        >
          {t('onboarding.time.recommended')}
        </Text>
      </View>
      <View
        accessibilityRole="radiogroup"
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        style={{
          alignSelf: 'stretch',
          height,
          borderRadius: height / 2,
          backgroundColor: palette.card,
          padding: pad,
          flexDirection: 'row',
        }}
      >
        {segment > 0 ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: pad,
                top: pad,
                width: segment,
                height: height - pad * 2,
                borderRadius: (height - pad * 2) / 2,
                backgroundColor: palette.selected,
              },
              indicator,
            ]}
          />
        ) : null}
        {DAILY_MINUTES.map((minutes) => {
          const selected = minutes === value;
          return (
            <Pressable
              key={minutes}
              accessibilityRole="radio"
              accessibilityLabel={`${t('onboarding.time.option', { count: minutes })}${
                minutes === RECOMMENDED_MINUTES ? `, ${t('onboarding.time.recommended')}` : ''
              }`}
              accessibilityState={{ checked: selected }}
              onPress={() => {
                tapFeedback();
                onChange(minutes);
              }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text
                weight="medium"
                color={selected ? palette.onSelected : palette.ink}
                style={{
                  fontSize: layout.labelSize,
                  lineHeight: Math.round(layout.labelSize * 1.2),
                }}
              >
                {minutes} {t('onboarding.time.unit')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Cómo se reparte una clase según su duración: llegar, moverse y cerrar (en minutos). */
const ANATOMY: Record<DailyMinutes, { arrive: number; move: number; close: number }> = {
  5: { arrive: 1, move: 3, close: 1 },
  10: { arrive: 1, move: 7, close: 2 },
  20: { arrive: 2, move: 15, close: 3 },
};

const PARTS = ['arrive', 'move', 'close'] as const;

/**
 * La anatomía de una clase: una barra con sus tres partes, que se reacomoda al cambiar los
 * minutos, y cuánto suma a la semana. Así "10 minutos" deja de ser un número abstracto.
 */
export function ClassAnatomy({ minutes }: { minutes: DailyMinutes }) {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  const parts = ANATOMY[minutes];
  const colors = { arrive: palette.faint, move: palette.accent, close: palette.selected };

  return (
    <View
      accessible
      accessibilityLabel={`${t('onboarding.time.anatomy', { count: minutes })}: ${PARTS.map(
        (part) => `${t(`onboarding.time.parts.${part}`)} ${parts[part]} min`,
      ).join(', ')}`}
      style={{ borderRadius: 20, backgroundColor: palette.card, padding: 16, gap: 12 }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}
      >
        <Text weight="medium" color={palette.ink} style={{ fontSize: 14, lineHeight: 18 }}>
          {t('onboarding.time.anatomy', { count: minutes })}
        </Text>
        <Text color={palette.muted} style={{ fontSize: 13, lineHeight: 17 }}>
          {t('onboarding.time.week', { count: minutes * 7 })}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {PARTS.map((part) => (
          <AnatomyPart key={part} flex={parts[part]} color={colors[part]} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4 }}>
        {PARTS.map((part) => (
          <View key={part} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors[part] }} />
            <Text weight="medium" color={palette.ink} style={{ fontSize: 12, lineHeight: 15 }}>
              {t(`onboarding.time.parts.${part}`)} · {parts[part]}′
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AnatomyPart({ flex, color }: { flex: number; color: string }) {
  const grow = useSharedValue(flex);
  useEffect(() => {
    grow.value = withSpring(flex, { damping: 18, stiffness: 160 });
  }, [flex, grow]);
  const style = useAnimatedStyle(() => ({ flexGrow: grow.value, flexBasis: 0 }));
  return <Animated.View style={[{ height: 10, borderRadius: 5, backgroundColor: color }, style]} />;
}
