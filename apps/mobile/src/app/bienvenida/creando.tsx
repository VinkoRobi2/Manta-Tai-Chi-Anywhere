import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckBadge } from '@/features/onboarding/ChoiceCard';
import {
  DEFAULT_PRACTICE,
  useOnboardingDraft,
  wantsAutoAnchor,
} from '@/features/onboarding/onboarding';
import { Ring } from '@/features/onboarding/PoseArt';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { successFeedback } from '@/lib/haptics';
import { fonts } from '@/theme/tokens';
import { Text } from '@/ui/Text';

const DURATION = 3200;
const DURATION_REDUCED = 1200;

/** Curva que arranca rápido y se calma al final. */
function easeOut(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

/**
 * "Creando tu plan": un anillo que se llena y la lista de lo que se tuvo en cuenta, armada
 * con las respuestas reales. Al terminar pasa sola al plan.
 */
export default function BuildingScreen() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const done = useRef(false);
  const context = draft.forRelative ? 'relative' : undefined;
  const join = (items: string[]) =>
    items.length > 1
      ? `${items.slice(0, -1).join(', ')} ${t('onboarding.and')} ${items[items.length - 1]}`
      : (items[0] ?? '');

  const steps = [
    t('onboarding.building.practice', {
      value: t(`onboarding.practice.${draft.practiceMode ?? DEFAULT_PRACTICE}`),
    }),
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

  useEffect(() => {
    const duration = reducedMotion ? DURATION_REDUCED : DURATION;
    const start = Date.now();
    const timer = setInterval(() => {
      const raw = Math.min(1, (Date.now() - start) / duration);
      setProgress(easeOut(raw));
      if (raw >= 1 && !done.current) {
        done.current = true;
        clearInterval(timer);
        successFeedback();
        setTimeout(() => router.replace('/bienvenida/plan'), 450);
      }
    }, 32);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  const percent = Math.round(progress * 100);
  const ring = Math.min(layout.artMax * 0.8, 210);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.background,
        paddingTop: insets.top + layout.topPad + 24,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: layout.gutter,
        alignItems: 'center',
      }}
    >
      <StatusBar style={palette.scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ width: '100%', maxWidth: layout.contentWidth, flex: 1 }}>
        <View
          style={{ alignSelf: 'center', width: ring, height: ring }}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('onboarding.building.title', { context })}
          accessibilityValue={{ min: 0, max: 100, now: percent }}
        >
          <Ring
            size={ring}
            stroke={10}
            progress={progress}
            track={palette.track}
            color={palette.accent}
            immediate
          />
          <View
            style={{
              position: 'absolute',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              color={palette.ink}
              maxFontSizeMultiplier={1}
              style={{
                fontFamily: fonts.semibold,
                fontSize: ring * 0.24,
                lineHeight: ring * 0.3,
                letterSpacing: -1.5,
                fontVariant: ['tabular-nums'],
              }}
            >
              {percent}%
            </Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(420).delay(80)} style={{ marginTop: 36 }}>
          <Text
            accessibilityRole="header"
            align="center"
            color={palette.ink}
            style={{
              fontFamily: fonts.semibold,
              fontSize: layout.titleSize - 2,
              lineHeight: layout.titleLine - 2,
              letterSpacing: -0.8,
            }}
          >
            {t('onboarding.building.title', { context })}
          </Text>
          <Text
            align="center"
            color={palette.muted}
            style={{ marginTop: 8, fontSize: layout.bodySize, lineHeight: layout.bodyLine }}
          >
            {t('onboarding.building.body', { context })}
          </Text>
        </Animated.View>

        <View style={{ marginTop: layout.sectionGap + 4, gap: 14, alignSelf: 'center' }}>
          {steps.map((label, index) => {
            const reached = progress >= (index + 1) / (steps.length + 0.6);
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
