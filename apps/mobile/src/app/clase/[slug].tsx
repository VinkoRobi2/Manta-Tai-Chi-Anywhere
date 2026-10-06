import { formatClock } from '@manta/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { findLesson, lessonTimeline } from '@/features/catalog/catalog';
import { poseFor } from '@/features/home/TodayCard';
import { ContinueButton } from '@/features/onboarding/ContinueButton';
import { PoseThumb } from '@/features/onboarding/PoseThumb';
import { useOnboardingLayout } from '@/features/onboarding/responsive';
import { Squish } from '@/features/onboarding/Squish';
import { enter } from '@/features/onboarding/StepScreen';
import { usePractices } from '@/features/practice/practice';
import { useHasPremium } from '@/features/premium/premium';
import { useSettings } from '@/features/settings/settings';
import { useLocale } from '@/lib/i18n';
import { appLight, fonts } from '@/theme/tokens';
import { AnchorGlyph, BackGlyph, ClockGlyph, LockGlyph, PlayGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

/** La ficha de una clase: qué se aprende, sus movimientos y el botón para empezar. */
export default function LessonScreen() {
  const { t } = useTranslation();
  const palette = appLight;
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const found = findLesson(locale, slug);
  const timeline = useMemo(() => (slug ? lessonTimeline(slug, locale) : null), [slug, locale]);
  const practices = usePractices();
  const settings = useSettings();
  const hasPremium = useHasPremium();
  const heroHeight = insets.top + 300;
  const column = { width: '100%', maxWidth: 640, alignSelf: 'center' } as const;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/inicio');
  };

  if (!found) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}
      >
        <Text color={palette.ink}>{t('lessonScreen.notFound')}</Text>
        <ContinueButton label={t('lessonScreen.back')} onPress={goBack} />
      </View>
    );
  }

  const { lesson, program } = found;
  const locked = lesson.isPremium && !hasPremium;
  const timesPracticed = practices.filter((practice) => practice.lessonSlug === lesson.slug).length;
  const minutes = Math.round(lesson.durationSec / 60);
  const care = settings.careTags.map((tag) => t(`lesson.care.${tag}`).toLowerCase());

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={{ height: heroHeight, backgroundColor: palette.selected, overflow: 'hidden' }}>
          {/* La ilustración ocupa la parte de arriba a la derecha; el título queda libre abajo. */}
          <View style={{ position: 'absolute', right: -6, bottom: 0 }}>
            <PoseThumb
              poses={[poseFor(lesson.spaceMode)]}
              width={190}
              height={heroHeight}
              figureHeight={200}
              sunSize={150}
              sunOffsetY={50}
              sunColor={locked ? '#3A3A3D' : palette.accent}
              tint={palette.onSelected}
            />
          </View>
          <View
            style={[
              column,
              {
                flex: 1,
                paddingTop: insets.top + 8,
                paddingHorizontal: layout.gutter,
                paddingBottom: 26,
                justifyContent: 'space-between',
              },
            ]}
          >
            <Squish
              onPress={goBack}
              accessibilityLabel={t('lessonScreen.back')}
              containerStyle={{ alignSelf: 'flex-start' }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BackGlyph color={palette.onSelected} size={22} strokeWidth={2.2} />
            </Squish>
            <Animated.View entering={enter(0)} style={{ gap: 8, maxWidth: '58%' }}>
              <Text
                variant="label"
                color={palette.accentOnSelected}
                style={{ fontSize: 12, letterSpacing: 1.4 }}
              >
                {t('lessonScreen.overline', { number: lesson.number, program: program.title })}
              </Text>
              <Text
                accessibilityRole="header"
                color={palette.onSelected}
                maxFontSizeMultiplier={1.3}
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 32,
                  lineHeight: 37,
                  letterSpacing: -0.8,
                }}
              >
                {lesson.title}
              </Text>
            </Animated.View>
          </View>
        </View>

        <View style={[column, { paddingHorizontal: layout.gutter, paddingTop: 22, gap: 22 }]}>
          <Animated.View entering={enter(1)} style={{ gap: 14 }}>
            <Text color={palette.ink} style={{ fontSize: 18, lineHeight: 26 }}>
              {lesson.summary}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip icon={<ClockGlyph color={palette.ink} size={16} strokeWidth={2} />}>
                {t('common.minutes', { count: minutes })}
              </Chip>
              <Chip icon={<AnchorGlyph color={palette.ink} size={16} strokeWidth={2} />}>
                {t('lessonScreen.offline')}
              </Chip>
              <Chip>{t(`level.${program.level}`)}</Chip>
            </View>
            {timesPracticed > 0 ? (
              <Text color={palette.muted} style={{ fontSize: 14, lineHeight: 19 }}>
                {t('lessonScreen.practiced', { count: timesPracticed })}
              </Text>
            ) : null}
          </Animated.View>

          {timeline ? (
            <Animated.View entering={enter(2)} style={{ gap: 10 }}>
              <Text
                accessibilityRole="header"
                color={palette.ink}
                style={{ fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26 }}
              >
                {t('lessonScreen.movements')}
              </Text>
              {timeline.segments.map((segment, index) => (
                <View
                  key={`${segment.clip}-${index}`}
                  accessible
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    minHeight: 60,
                    paddingHorizontal: 14,
                    borderRadius: 18,
                    backgroundColor: palette.card,
                  }}
                >
                  <Text
                    weight="semibold"
                    color={palette.muted}
                    style={{ width: 20, fontSize: 15, lineHeight: 19 }}
                  >
                    {index + 1}
                  </Text>
                  <Text
                    weight="medium"
                    color={palette.ink}
                    style={{ flex: 1, fontSize: 16, lineHeight: 21 }}
                  >
                    {segment.title}
                  </Text>
                  <Text color={palette.muted} style={{ fontSize: 14, lineHeight: 18 }}>
                    {formatClock(segment.durationMs)}
                  </Text>
                </View>
              ))}
            </Animated.View>
          ) : null}

          {care.length > 0 ? (
            <Text color={palette.muted} style={{ fontSize: 14, lineHeight: 20 }}>
              {t('lessonScreen.care', { zones: care.join(', ') })}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: layout.gutter,
          paddingTop: 10,
          paddingBottom: insets.bottom + 10,
          borderTopWidth: 1,
          borderTopColor: palette.line,
          backgroundColor: palette.background,
        }}
      >
        <View style={[column, { gap: 6 }]}>
          {locked ? (
            <>
              <ContinueButton
                label={t('lessonScreen.locked')}
                onPress={() => undefined}
                disabled
                icon={<LockGlyph color={palette.faint} size={16} strokeWidth={2.2} />}
              />
              <Text align="center" color={palette.muted} style={{ fontSize: 14, lineHeight: 19 }}>
                {t('lessonScreen.lockedBody')}
              </Text>
            </>
          ) : (
            <ContinueButton
              label={timesPracticed > 0 ? t('lessonScreen.again') : t('lessonScreen.start')}
              onPress={() =>
                router.push({ pathname: '/practica/[slug]', params: { slug: lesson.slug } })
              }
              icon={<PlayGlyph color={palette.onSelected} size={16} />}
            />
          )}
        </View>
      </View>
    </View>
  );
}

function Chip({ icon, children }: { icon?: ReactNode; children: string }) {
  const palette = appLight;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 34,
        paddingHorizontal: 12,
        borderRadius: 17,
        backgroundColor: palette.card,
      }}
    >
      {icon}
      <Text weight="medium" color={palette.ink} style={{ fontSize: 14, lineHeight: 18 }}>
        {children}
      </Text>
    </View>
  );
}
