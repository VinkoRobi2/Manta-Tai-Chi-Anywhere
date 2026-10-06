import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckBadge } from '@/features/onboarding/ChoiceCard';
import { ContinueButton, TextButton } from '@/features/onboarding/ContinueButton';
import {
  completeOnboarding,
  DEFAULT_PRACTICE,
  markScreen,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding';
import { PlayGlyph } from '@/features/onboarding/OptionIcons';
import type { Pose } from '@/features/onboarding/PoseArt';
import { PoseThumb } from '@/features/onboarding/PoseThumb';
import { Squish } from '@/features/onboarding/Squish';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { enter } from '@/features/onboarding/StepScreen';
import type { PracticeMode } from '@/features/settings/settings';
import { fonts } from '@/theme/tokens';
import { Text } from '@/ui/Text';

const POSES: Record<PracticeMode, readonly Pose[]> = {
  seated: ['seated'],
  standing: ['standing'],
  both: ['standing', 'seated'],
};

/** La primera clase de cada programa. "Las dos" empieza sentado: es lo más seguro para arrancar. */
const FIRST_LESSON: Record<PracticeMode, { name: 'seated' | 'standing'; minutes: number }> = {
  seated: { name: 'seated', minutes: 6 },
  standing: { name: 'standing', minutes: 10 },
  both: { name: 'seated', minutes: 6 },
};

/** La semana empieza hoy: las iniciales de los días, de hoy en adelante. */
function weekFromToday(days: readonly string[]): string[] {
  const today = (new Date().getDay() + 6) % 7; // 0 = lunes
  return Array.from({ length: 7 }, (_, index) => days[(today + index) % 7] ?? '');
}

/** El plan: la tarjeta del programa, la semana que empieza hoy y la primera clase. */
export default function PlanScreen() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const insets = useSafeAreaInsets();
  const mode = draft.practiceMode ?? DEFAULT_PRACTICE;
  const context = draft.forRelative ? 'relative' : undefined;
  const week = weekFromToday(t('onboarding.plan.weekdays', { returnObjects: true }) as string[]);
  const tablet = layout.breakpoint === 'tablet';
  const compact = layout.breakpoint === 'compact';
  // La tarjeta negra mide lo de la referencia; en pantallas más bajas se encoge hasta cardMin
  // para que todo quepa sin scroll. La figura se ajusta al alto real de la tarjeta.
  const cardMax = tablet ? 300 : compact ? 196 : 236;
  const cardMin = tablet ? 300 : compact ? 170 : 210;
  const [cardHeight, setCardHeight] = useState(cardMax);
  // Muy poco alto (iPhone SE de primera generación, Android bajos): sin subtítulo ni tarjeta de la clase.
  const tiny = !tablet && layout.height - insets.top - insets.bottom < 600;
  const lesson = FIRST_LESSON[mode];
  const lessonName = t(`onboarding.plan.lesson.${lesson.name}`);
  const lessonMinutes = t('common.minutes', { count: lesson.minutes });
  const artWidth = Math.round(cardHeight * 0.92);
  // El texto termina antes de donde empieza el sol (la figura va pegada a la derecha: el sol empieza
  // a 0,76 × alto del borde). Se calcula con el alto máximo: así no cambia de líneas al encogerse.
  const artReserve = Math.round(cardMax * 0.76) + 4;
  const column = { width: '100%', maxWidth: layout.contentWidth } as const;

  useFocusEffect(useCallback(() => markScreen('plan'), []));

  // Por ahora no hay clases: se guardan las respuestas y se vuelve a la bienvenida.
  const start = () => {
    completeOnboarding();
    router.dismissTo('/bienvenida');
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style={palette.scheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          // En tablets el bloque va centrado, como en las preguntas.
          justifyContent: tablet ? 'center' : 'flex-start',
          // En el teléfono, la barra de estado ya hace de margen arriba.
          paddingTop: insets.top + layout.topPad,
          paddingHorizontal: layout.gutter,
          paddingBottom: layout.gap,
        }}
      >
        <View style={[column, { flexGrow: tablet ? 0 : 1 }]}>
          <Animated.View entering={enter(0)}>
            <CheckBadge size={compact ? 30 : 34} />
            <Text
              accessibilityRole="header"
              color={palette.ink}
              maxFontSizeMultiplier={1.4}
              style={{
                marginTop: 16,
                fontFamily: fonts.semibold,
                fontSize: layout.titleSize,
                lineHeight: layout.titleLine,
                letterSpacing: -0.8,
              }}
            >
              {t('onboarding.plan.title', { context })}
            </Text>
            {tiny ? null : (
              <Text
                color={palette.muted}
                style={{ marginTop: 8, fontSize: layout.bodySize, lineHeight: layout.bodyLine }}
              >
                {t('onboarding.plan.body', { context })}
              </Text>
            )}
          </Animated.View>

          <Animated.View
            entering={enter(1)}
            onLayout={(event) => setCardHeight(Math.round(event.nativeEvent.layout.height))}
            style={{
              marginTop: layout.sectionGap,
              flexGrow: tablet ? 0 : 1,
              minHeight: cardMin,
              maxHeight: cardMax,
              borderRadius: tablet ? 32 : 28,
              backgroundColor: palette.selected,
              overflow: 'hidden',
            }}
          >
            <View style={{ position: 'absolute', right: -6, bottom: 0 }}>
              <PoseThumb
                poses={POSES[mode]}
                width={artWidth}
                height={cardHeight}
                figureHeight={cardHeight * 0.92}
                sunSize={cardHeight * 0.6}
                sunOffsetY={cardHeight * 0.02}
                sunColor={palette.accent}
                tint={palette.onSelected}
              />
            </View>
            <View style={{ padding: compact ? 16 : 22, paddingRight: artReserve, gap: 8 }}>
              <Text
                variant="label"
                color={palette.accentOnSelected}
                style={{ letterSpacing: 1.6, fontSize: 12 }}
              >
                {t('onboarding.plan.overline')}
              </Text>
              <Text
                color={palette.onSelected}
                maxFontSizeMultiplier={1.3}
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: tablet ? 34 : compact ? 22 : 28,
                  lineHeight: tablet ? 40 : compact ? 27 : 33,
                  letterSpacing: -0.6,
                }}
              >
                {t(`onboarding.plan.name.${mode}`)}
              </Text>
              <View style={{ gap: compact ? 4 : 6, marginTop: compact ? 4 : 8 }}>
                {[
                  t('onboarding.plan.days'),
                  t('onboarding.plan.perDay', { count: draft.dailyMinutes }),
                  t('onboarding.plan.level'),
                ].map((label) => (
                  <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: palette.accent,
                      }}
                    />
                    <Text
                      variant="caption"
                      weight="medium"
                      color={palette.onSelectedMuted}
                      style={{ fontSize: 14, lineHeight: 19 }}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={enter(2)} style={{ marginTop: layout.sectionGap - 4 }}>
            <Text variant="caption" weight="medium" color={palette.muted}>
              {t('onboarding.plan.week')}
            </Text>
            <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
              {week.map((day, index) => {
                const today = index === 0;
                const size = tablet ? 46 : compact ? 36 : 40;
                return (
                  <View
                    key={`${day}-${index}`}
                    style={{ alignItems: 'center', gap: 6 }}
                    accessible={today}
                    accessibilityLabel={today ? t('onboarding.plan.today') : undefined}
                  >
                    <View
                      style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: today ? palette.accent : palette.card,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        weight="medium"
                        color={today ? palette.onAccent : palette.muted}
                        style={{ fontSize: 14, lineHeight: 18 }}
                      >
                        {day}
                      </Text>
                    </View>
                    <Text
                      variant="caption"
                      weight="medium"
                      color={today ? palette.ink : 'transparent'}
                      style={{ fontSize: 11, lineHeight: 14 }}
                    >
                      {t('onboarding.plan.today')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {tiny ? null : (
            <Animated.View entering={enter(3)} style={{ marginTop: compact ? 12 : 18 }}>
              <Squish
                onPress={start}
                accessibilityLabel={`${t('onboarding.plan.firstClass', { context })}: ${lessonName}, ${lessonMinutes}`}
                style={{
                  minHeight: tablet ? 84 : compact ? 62 : 74,
                  borderRadius: tablet ? 26 : 22,
                  backgroundColor: palette.card,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: compact ? 12 : 15,
                  paddingVertical: 10,
                  paddingLeft: compact ? 12 : 14,
                  paddingRight: compact ? 14 : 16,
                }}
              >
                <View
                  style={{
                    width: tablet ? 54 : compact ? 40 : 46,
                    height: tablet ? 54 : compact ? 40 : 46,
                    borderRadius: tablet ? 15 : 12,
                    backgroundColor: palette.selected,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PlayGlyph color={palette.accent} size={tablet ? 20 : 16} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text color={palette.muted} style={{ fontSize: 13, lineHeight: 17 }}>
                    {t('onboarding.plan.firstClass', { context })}
                  </Text>
                  <Text
                    weight="semibold"
                    color={palette.ink}
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.3}
                    style={{ fontSize: compact ? 16 : 17, lineHeight: 22, letterSpacing: -0.2 }}
                  >
                    {lessonName}
                  </Text>
                </View>
                <Text color={palette.muted} style={{ fontSize: 15, lineHeight: 20 }}>
                  {lessonMinutes}
                </Text>
              </Squish>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: layout.gutter,
          paddingTop: 8,
          paddingBottom: insets.bottom + (compact ? 4 : 8),
          alignItems: 'center',
        }}
      >
        <View style={column}>
          <ContinueButton
            label={t('onboarding.plan.start')}
            onPress={start}
            icon={<PlayGlyph color={palette.onSelected} size={14} />}
          />
          <TextButton
            label={t('onboarding.plan.change')}
            color={palette.muted}
            onPress={() => router.dismissTo('/bienvenida/practica')}
          />
        </View>
      </View>
    </View>
  );
}
