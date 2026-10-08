import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { lessonArt } from '@/features/catalog/art';
import { ArtPhoto } from '@/features/catalog/ArtPhoto';
import { catalog, programsForMode, type Lesson } from '@/features/catalog/catalog';
import { programDone, ProgramCover } from '@/features/home/ProgramCards';
import { Segmented } from '@/features/home/Segmented';
import { TAB_BAR_HEIGHT } from '@/features/navigation/TabBar';
import { useOnboardingLayout } from '@/features/onboarding/responsive';
import { Squish } from '@/features/onboarding/Squish';
import { enter } from '@/features/onboarding/StepScreen';
import { usePractices } from '@/features/practice/practice';
import { useHasPremium } from '@/features/premium/premium';
import { useSettings } from '@/features/settings/settings';
import { useLocale } from '@/lib/i18n';
import { appLight, fonts } from '@/theme/tokens';
import { CheckGlyph, ChevronGlyph, LockGlyph, PlayGlyph, SavedGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

/**
 * Clases: un programa a la vez. Arriba se elige el programa; debajo, su portada grande con la foto
 * y lo que va hecho, y sus clases, cada una con su foto. La que sigue va marcada en sol.
 * Sin programa elegido (o al llegar desde Inicio sin uno), se abre el que está en curso.
 */
export default function ClassesScreen() {
  const { t } = useTranslation();
  const palette = appLight;
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const settings = useSettings();
  const practices = usePractices();
  const hasPremium = useHasPremium();
  const { programa } = useLocalSearchParams<{ programa?: string }>();
  const programs = useMemo(() => catalog(locale), [locale]);
  const practiced = useMemo(
    () => new Set(practices.map((practice) => practice.lessonSlug)),
    [practices],
  );
  // El programa en curso: el primero (según cómo practica) con clases por hacer.
  const current = useMemo(() => {
    const ordered = programsForMode(locale, settings.practiceMode);
    return (
      ordered.find((item) => programDone(item, practiced) < item.lessons.length) ?? ordered[0]!
    ).slug;
  }, [locale, practiced, settings.practiceMode]);
  const program =
    programs.find((item) => item.slug === programa) ??
    programs.find((item) => item.slug === current)!;
  const done = programDone(program, practiced);
  const next = program.lessons.find((lesson) => !practiced.has(lesson.slug)) ?? null;

  const column = { width: '100%', maxWidth: 640, alignSelf: 'center' } as const;
  const coverWidth = Math.min(layout.width, 640) - layout.gutter * 2;
  const coverHeight = Math.round(Math.min(coverWidth * 0.95, 420));

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: TAB_BAR_HEIGHT + 32 }}
      >
        <View style={[column, { paddingHorizontal: layout.gutter, gap: 18 }]}>
          <Animated.View entering={enter(0)} style={{ gap: 6 }}>
            <Text
              accessibilityRole="header"
              color={palette.ink}
              style={{
                fontFamily: fonts.semibold,
                fontSize: 36,
                lineHeight: 42,
                letterSpacing: -1.2,
              }}
            >
              {t('classes.title')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <SavedGlyph color={palette.muted} size={16} strokeWidth={2} />
              <Text color={palette.muted} style={{ flexShrink: 1, fontSize: 15, lineHeight: 20 }}>
                {t('classes.body')}
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={enter(1)}>
            <Segmented
              segments={programs.map((item) => ({
                value: item.slug,
                label: t(`classes.short.${item.slug}`, { defaultValue: item.title }),
                icon:
                  item.isPremium && !hasPremium
                    ? (color: string) => <LockGlyph color={color} size={13} strokeWidth={2.2} />
                    : undefined,
              }))}
              value={program.slug}
              onChange={(slug) => router.setParams({ programa: slug })}
            />
          </Animated.View>

          <Animated.View key={program.slug} entering={FadeIn.duration(320)} style={{ gap: 26 }}>
            <ProgramCover
              program={program}
              done={done}
              width={coverWidth}
              height={coverHeight}
              radius={30}
              drift
              large
            />

            <View style={{ gap: 4 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <Text
                  accessibilityRole="header"
                  color={palette.ink}
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 22,
                    lineHeight: 28,
                    letterSpacing: -0.5,
                  }}
                >
                  {t('classes.listTitle')}
                </Text>
                <Text
                  weight="medium"
                  color={palette.muted}
                  style={{ fontSize: 14, lineHeight: 18 }}
                >
                  {t('home.programDone', { done, total: program.lessons.length })}
                </Text>
              </View>
              {program.lessons.map((lesson, index) => (
                <LessonRow
                  key={lesson.slug}
                  lesson={lesson}
                  done={practiced.has(lesson.slug)}
                  locked={lesson.isPremium && !hasPremium}
                  next={lesson.slug === next?.slug}
                  last={index === program.lessons.length - 1}
                />
              ))}
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const THUMB = 78;

/** Una clase: su foto, el número, el nombre y la duración. Hecha: un visto sobre la foto. */
function LessonRow({
  lesson,
  done,
  locked,
  next,
  last,
}: {
  lesson: Lesson;
  done: boolean;
  locked: boolean;
  next: boolean;
  last: boolean;
}) {
  const { t } = useTranslation();
  const palette = appLight;
  const minutes = t('common.minutes', { count: Math.round(lesson.durationSec / 60) });
  const state = done ? t('classes.done') : locked ? t('classes.premium') : null;

  return (
    <View>
      <Squish
        onPress={() => router.push({ pathname: '/clase/[slug]', params: { slug: lesson.slug } })}
        pressedScale={0.98}
        accessibilityLabel={[
          t('classes.lessonNumber', { number: lesson.number }),
          lesson.title,
          minutes,
          state,
          next && !locked ? t('classes.next') : null,
        ]
          .filter(Boolean)
          .join(', ')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 }}
      >
        <View
          style={{
            width: THUMB,
            height: THUMB,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: palette.card,
          }}
        >
          <ArtPhoto art={lessonArt(lesson)} width={THUMB} height={THUMB} />
          {done || locked ? (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: locked ? 'rgba(10, 10, 10, 0.55)' : 'rgba(10, 10, 10, 0.32)',
              }}
            >
              {done ? (
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: palette.accent,
                  }}
                >
                  <CheckGlyph color={palette.onAccent} size={16} strokeWidth={2.6} />
                </View>
              ) : (
                <LockGlyph color={palette.onSelected} size={20} strokeWidth={2} />
              )}
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              weight="semibold"
              color={palette.muted}
              style={{ fontSize: 12, lineHeight: 15, letterSpacing: 1, textTransform: 'uppercase' }}
            >
              {t('classes.lessonNumber', { number: lesson.number })}
            </Text>
            {next && !locked ? (
              <View
                style={{
                  height: 20,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  justifyContent: 'center',
                  backgroundColor: palette.accent,
                }}
              >
                <Text
                  weight="semibold"
                  color={palette.onAccent}
                  style={{ fontSize: 11, lineHeight: 14 }}
                >
                  {t('classes.next')}
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            weight="semibold"
            color={locked ? palette.muted : palette.ink}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}
            style={{ fontSize: 17, lineHeight: 22, letterSpacing: -0.2 }}
          >
            {lesson.title}
          </Text>
          <Text color={palette.muted} style={{ fontSize: 14, lineHeight: 18 }}>
            {state ? `${minutes} · ${state}` : minutes}
          </Text>
        </View>

        {next && !locked ? (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.selected,
            }}
          >
            <PlayGlyph color={palette.accent} size={16} />
          </View>
        ) : (
          <ChevronGlyph color={palette.faint} size={20} />
        )}
      </Squish>
      {last ? null : (
        <View style={{ height: 1, marginLeft: THUMB + 14, backgroundColor: palette.line }} />
      )}
    </View>
  );
}
