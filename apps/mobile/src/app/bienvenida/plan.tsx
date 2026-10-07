import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { programsForMode } from '@/features/catalog/catalog';
import { CheckBadge } from '@/features/onboarding/ChoiceCard';
import { ContinueButton, TextButton } from '@/features/onboarding/ContinueButton';
import {
  completeOnboarding,
  DEFAULT_PRACTICE,
  markScreen,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding';
import { Burst, RevealText, Ripples } from '@/features/onboarding/motion';
import { PlayGlyph } from '@/features/onboarding/OptionIcons';
import {
  PhotoSlides,
  PRACTICE_PHOTOS,
  usePhotoCycle,
  type PracticePhoto,
} from '@/features/onboarding/PhotoSlides';
import { Squish } from '@/features/onboarding/Squish';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { enter } from '@/features/onboarding/StepScreen';
import type { PracticeMode } from '@/features/settings/settings';
import { useLocale } from '@/lib/i18n';
import { fonts } from '@/theme/tokens';
import { Text } from '@/ui/Text';

/** La foto del programa según cómo practica. "Las dos" alterna las dos fotos. */
const PHOTOS: Record<PracticeMode, readonly PracticePhoto[]> = {
  seated: [PRACTICE_PHOTOS.seated],
  standing: [PRACTICE_PHOTOS.standing],
  both: [PRACTICE_PHOTOS.seated, PRACTICE_PHOTOS.standing],
};

/**
 * El plan: el programa (su nombre a la izquierda y la foto de cómo practica a la derecha, sobre el
 * blanco de la app) y el camino de las tres primeras clases (hoy, mañana, día 3).
 */
export default function PlanScreen() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const mode = draft.practiceMode ?? DEFAULT_PRACTICE;
  const context = draft.forRelative ? 'relative' : undefined;
  const tablet = layout.breakpoint === 'tablet';
  const compact = layout.breakpoint === 'compact';
  // El bloque del programa mide cardMax; en pantallas más bajas se encoge hasta cardMin para que
  // todo quepa sin scroll. La foto se ajusta al alto real del bloque.
  const cardMax = tablet ? 320 : compact ? 196 : 256;
  const cardMin = tablet ? 300 : compact ? 170 : 210;
  const [cardHeight, setCardHeight] = useState(cardMax);
  // Muy poco alto (iPhone SE de primera generación, Android bajos): sin subtítulo ni tarjeta de la clase.
  const tiny = !tablet && layout.height - insets.top - insets.bottom < 600;
  // La primera clase del programa que le toca ("Las dos" empieza sentado: es lo más seguro).
  const program = programsForMode(locale, mode)[0]!;
  const lesson = program.lessons[0]!;
  // Las tres primeras clases: hoy, mañana y el día 3. En pantallas muy bajas, solo la de hoy.
  const firstLessons = program.lessons.slice(0, tiny ? 1 : 3);
  // La foto, en vertical como las de las clases; nunca más de la mitad del ancho.
  const columnWidth = Math.min(layout.width - layout.gutter * 2, layout.contentWidth);
  const photoWidth = Math.round(Math.min(cardHeight * 0.74, columnWidth * 0.5));
  const photos = PHOTOS[mode];
  const { active, moving } = usePhotoCycle(photos.length);
  const column = { width: '100%', maxWidth: layout.contentWidth } as const;

  useFocusEffect(useCallback(() => markScreen('plan'), []));

  // Se guardan las respuestas, Inicio queda debajo y se abre la primera clase.
  const start = () => {
    completeOnboarding();
    router.replace('/inicio');
    router.push({ pathname: '/clase/[slug]', params: { slug: lesson.slug } });
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
          <View>
            <View
              style={{
                width: compact ? 30 : 34,
                height: compact ? 30 : 34,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Burst size={compact ? 96 : 110} color={palette.accent} count={10} delay={200} />
              <CheckBadge size={compact ? 30 : 34} />
            </View>
            <View style={{ marginTop: 16 }}>
              <RevealText
                text={t('onboarding.plan.title', { context })}
                header
                color={palette.ink}
                delay={120}
                maxFontSizeMultiplier={1.4}
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: layout.titleSize,
                  lineHeight: layout.titleLine,
                  letterSpacing: -0.8,
                }}
              />
            </View>
            {tiny ? null : (
              <Text
                color={palette.muted}
                style={{ marginTop: 8, fontSize: layout.bodySize, lineHeight: layout.bodyLine }}
              >
                {t('onboarding.plan.body', { context })}
              </Text>
            )}
          </View>

          <Animated.View
            entering={enter(1)}
            onLayout={(event) => setCardHeight(Math.round(event.nativeEvent.layout.height))}
            style={{
              marginTop: layout.sectionGap,
              flexGrow: tablet ? 0 : 1,
              minHeight: cardMin,
              maxHeight: cardMax,
              flexDirection: 'row',
              alignItems: 'center',
              gap: compact ? 14 : 18,
            }}
          >
            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accent }}
                />
                <Text
                  variant="label"
                  color={palette.muted}
                  style={{ letterSpacing: 1.6, fontSize: 12 }}
                >
                  {t('onboarding.plan.overline')}
                </Text>
              </View>
              <Text
                color={palette.ink}
                maxFontSizeMultiplier={1.3}
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: tablet ? 34 : compact ? 24 : 28,
                  lineHeight: tablet ? 40 : compact ? 29 : 33,
                  letterSpacing: -0.6,
                }}
              >
                {t(`onboarding.plan.name.${mode}`)}
              </Text>
              <View style={{ gap: compact ? 4 : 6, marginTop: compact ? 2 : 6 }}>
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
                      color={palette.muted}
                      style={{ fontSize: 14, lineHeight: 19 }}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View
              style={{
                width: photoWidth,
                alignSelf: 'stretch',
                borderRadius: tablet ? 32 : 28,
                overflow: 'hidden',
                backgroundColor: palette.card,
              }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <PhotoSlides
                photos={photos}
                active={active}
                moving={moving}
                width={photoWidth}
                height={cardHeight}
                contentPosition="center"
              />
            </View>
          </Animated.View>

          <View style={{ marginTop: layout.sectionGap - 4 }}>
            <Animated.View entering={enter(2)}>
              <Text variant="caption" weight="medium" color={palette.muted}>
                {t('onboarding.plan.firstClasses')}
              </Text>
            </Animated.View>
            <View style={{ marginTop: 10 }}>
              {firstLessons.map((item, index) => {
                const today = index === 0;
                const minutes = t('common.minutes', { count: Math.round(item.durationSec / 60) });
                const day = t(`onboarding.plan.dayLabel.${index}`);
                const dot = tablet ? 46 : compact ? 36 : 40;
                const last = index === firstLessons.length - 1;
                return (
                  <Animated.View
                    key={item.slug}
                    entering={FadeInDown.duration(420).delay(700 + index * 140)}
                  >
                    <Squish
                      onPress={today ? start : undefined}
                      disabled={!today}
                      haptic={today}
                      pressedScale={0.98}
                      accessibilityLabel={`${day}: ${item.title}, ${minutes}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: compact ? 12 : 14,
                        paddingVertical: compact ? 8 : 10,
                        paddingHorizontal: today ? (compact ? 10 : 12) : 0,
                        marginHorizontal: today ? 0 : compact ? 10 : 12,
                        borderRadius: 20,
                        backgroundColor: today ? palette.card : 'transparent',
                      }}
                    >
                      <View style={{ width: dot, alignItems: 'center' }}>
                        <View
                          style={{
                            width: dot,
                            height: dot,
                            borderRadius: dot / 2,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: today ? palette.accent : palette.background,
                            borderWidth: today ? 0 : 2,
                            borderColor: palette.track,
                          }}
                        >
                          {today ? (
                            <>
                              <Ripples
                                size={dot}
                                color={palette.accent}
                                count={2}
                                durationMs={2600}
                                from={1}
                                to={1.5}
                              />
                              <PlayGlyph color={palette.onAccent} size={tablet ? 18 : 15} />
                            </>
                          ) : (
                            <Text
                              weight="semibold"
                              color={palette.muted}
                              style={{ fontSize: 14, lineHeight: 18 }}
                            >
                              {item.number}
                            </Text>
                          )}
                        </View>
                        {/* La línea del camino hasta la siguiente clase. */}
                        {last ? null : (
                          <View
                            style={{
                              position: 'absolute',
                              top: dot + (compact ? 8 : 10),
                              width: 2,
                              height: compact ? 16 : 20,
                              borderRadius: 1,
                              backgroundColor: palette.track,
                            }}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text
                          weight={today ? 'semibold' : 'medium'}
                          color={today ? palette.ink : palette.muted}
                          numberOfLines={1}
                          maxFontSizeMultiplier={1.3}
                          style={{
                            fontSize: compact ? 15 : 16,
                            lineHeight: 21,
                            letterSpacing: -0.2,
                          }}
                        >
                          {item.title}
                        </Text>
                        <Text
                          color={today ? palette.muted : palette.faint}
                          style={{ fontSize: 13, lineHeight: 17 }}
                        >
                          {`${day} · ${minutes}`}
                        </Text>
                      </View>
                    </Squish>
                  </Animated.View>
                );
              })}
            </View>
          </View>
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
