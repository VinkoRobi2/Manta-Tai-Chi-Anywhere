import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckBadge } from '@/features/onboarding/ChoiceCard';
import { Burst, Ripples, useBreath } from '@/features/onboarding/motion';
import {
  DEFAULT_PRACTICE,
  useOnboardingDraft,
  wantsAutoAnchor,
} from '@/features/onboarding/onboarding';
import { Ring, type Pose } from '@/features/onboarding/PoseArt';
import { PoseThumb } from '@/features/onboarding/PoseThumb';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import type { PracticeMode } from '@/features/settings/settings';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { fonts } from '@/theme/tokens';
import { Text } from '@/ui/Text';

const DURATION = 4200;
const DURATION_REDUCED = 1200;

const POSES: Record<PracticeMode, readonly Pose[]> = {
  seated: ['seated'],
  standing: ['standing'],
  both: ['standing', 'seated'],
};

/** Curva que arranca rápido y se calma al final. */
function easeOut(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

/** Entre 0 y 1 según dónde está `value` entre `from` y `to`. */
function between(value: number, from: number, to: number): number {
  return Math.min(1, Math.max(0, (value - from) / (to - from)));
}

/**
 * "Creando tu plan": un medallón de sol crece mientras salen ondas, aparece la silueta de cómo
 * va a practicar y se marca, una a una, la lista de lo que se tuvo en cuenta (con las respuestas
 * reales). Al terminar, chispas de sol y pasa sola al plan.
 */
export default function BuildingScreen() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const done = useRef(false);
  const context = draft.forRelative ? 'relative' : undefined;
  const mode = draft.practiceMode ?? DEFAULT_PRACTICE;
  const join = (items: string[]) =>
    items.length > 1
      ? `${items.slice(0, -1).join(', ')} ${t('onboarding.and')} ${items[items.length - 1]}`
      : (items[0] ?? '');

  const steps = [
    t('onboarding.building.practice', { value: t(`onboarding.practice.${mode}`) }),
    draft.goals.length > 0
      ? t('onboarding.building.goals', {
          value: join(draft.goals.map((goal) => t(`onboarding.feel.${goal}`))),
        })
      : null,
    t('onboarding.building.minutes', { count: draft.dailyMinutes }),
    draft.careTags.length > 0
      ? t('onboarding.building.care', {
          value: join(draft.careTags.map((tag) => t(`lesson.care.${tag}`))),
        })
      : t('onboarding.building.noCare'),
    t(
      wantsAutoAnchor(draft.offlineUsage)
        ? 'onboarding.building.offline'
        : 'onboarding.building.online',
    ),
  ].filter((item): item is string => item !== null);
  const reachedCount = steps.filter(
    (_, index) => progress >= (index + 1) / (steps.length + 0.6),
  ).length;

  useEffect(() => {
    const duration = reducedMotion ? DURATION_REDUCED : DURATION;
    const start = Date.now();
    const timer = setInterval(() => {
      const raw = Math.min(1, (Date.now() - start) / duration);
      setProgress(easeOut(raw));
      if (raw >= 1 && !done.current) {
        done.current = true;
        clearInterval(timer);
        setFinished(true);
        successFeedback();
        setTimeout(() => router.replace('/bienvenida/plan'), reducedMotion ? 450 : 1100);
      }
    }, 32);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  // Un toque suave cada vez que se marca un punto de la lista.
  const lastReached = useRef(0);
  useEffect(() => {
    if (reachedCount > lastReached.current) {
      lastReached.current = reachedCount;
      tapFeedback();
    }
  }, [reachedCount]);

  const percent = Math.round(progress * 100);
  const stage = Math.min(layout.artMax, 260, layout.width - layout.gutter * 2);
  const medal = stage * 0.62;
  const grow = 0.45 + 0.55 * easeOut(between(progress, 0, 0.55));
  const figure = between(progress, 0.3, 0.75);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.background,
        paddingTop: insets.top + layout.topPad + 8,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: layout.gutter,
        alignItems: 'center',
      }}
    >
      <StatusBar style={palette.scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ width: '100%', maxWidth: layout.contentWidth, flex: 1 }}>
        <View
          style={{
            alignSelf: 'center',
            width: stage,
            height: stage,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('onboarding.building.title', { context })}
          accessibilityValue={{ min: 0, max: 100, now: percent }}
        >
          <Ripples
            size={medal}
            color={palette.accent}
            count={3}
            from={1}
            to={1.6}
            strokeWidth={2}
          />
          <View style={{ position: 'absolute' }}>
            <Ring
              size={stage * 0.96}
              stroke={4}
              progress={progress}
              track={palette.track}
              color={palette.ink}
              immediate
            />
          </View>
          <Medallion size={medal} scale={grow} figure={figure} poses={POSES[mode]} />
          {finished ? <Burst size={stage * 1.05} color={palette.accent} count={10} /> : null}
        </View>

        <Text
          align="center"
          color={palette.ink}
          maxFontSizeMultiplier={1}
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{
            marginTop: 14,
            fontFamily: fonts.semibold,
            fontSize: 40,
            lineHeight: 46,
            letterSpacing: -1.2,
            fontVariant: ['tabular-nums'],
          }}
        >
          {percent}%
        </Text>

        <Animated.View entering={FadeInDown.duration(420).delay(80)} style={{ marginTop: 6 }}>
          <Text
            accessibilityRole="header"
            align="center"
            color={palette.ink}
            style={{
              fontFamily: fonts.semibold,
              fontSize: layout.titleSize - 4,
              lineHeight: layout.titleLine - 4,
              letterSpacing: -0.8,
            }}
          >
            {t('onboarding.building.title', { context })}
          </Text>
          <Text
            align="center"
            color={palette.muted}
            style={{ marginTop: 6, fontSize: layout.bodySize, lineHeight: layout.bodyLine }}
          >
            {t('onboarding.building.body', { context })}
          </Text>
        </Animated.View>

        <View style={{ marginTop: layout.sectionGap - 4, gap: 12, alignSelf: 'center' }}>
          {steps.map((label, index) => {
            const reached = index < reachedCount;
            return (
              <Animated.View
                key={label}
                entering={FadeIn.duration(300).delay(150 + index * 120)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                {reached ? (
                  <CheckBadge size={24} />
                ) : (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: palette.track,
                    }}
                  />
                )}
                <Text
                  color={reached ? palette.ink : palette.faint}
                  style={{ fontSize: layout.labelSize - 1, lineHeight: layout.labelSize + 4 }}
                >
                  {label}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** El medallón: un sol redondo con la silueta adentro, recortada por el borde. Respira. */
function Medallion({
  size,
  scale,
  figure,
  poses,
}: {
  size: number;
  /** Cuánto creció (0,45 → 1). */
  scale: number;
  /** Cuánto se ve la silueta (0 → 1). */
  figure: number;
  poses: readonly Pose[];
}) {
  const palette = useOnboardingPalette();
  const breath = useBreath();
  return (
    <View style={{ width: size, height: size, transform: [{ scale }] }}>
      <BreathingScale breath={breath}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            backgroundColor: palette.accent,
          }}
        >
          <View
            style={{
              opacity: figure,
              transform: [{ translateY: (1 - figure) * size * 0.18 }],
            }}
          >
            <PoseThumb
              poses={poses}
              width={size}
              height={size}
              figureHeight={size * 0.9}
              sunSize={0}
              sunColor="transparent"
              tint={palette.ink}
            />
          </View>
        </View>
      </BreathingScale>
    </View>
  );
}

function BreathingScale({
  breath,
  children,
}: {
  breath: ReturnType<typeof useBreath>;
  children: ReactNode;
}) {
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 0.97 + breath.value * 0.05 }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
