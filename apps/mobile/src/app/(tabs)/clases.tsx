import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalog, type Lesson, type Program } from '@/features/catalog/catalog';
import { TAB_BAR_HEIGHT } from '@/features/navigation/TabBar';
import { useOnboardingLayout } from '@/features/onboarding/responsive';
import { Squish } from '@/features/onboarding/Squish';
import { enter } from '@/features/onboarding/StepScreen';
import { usePractices } from '@/features/practice/practice';
import { useHasPremium } from '@/features/premium/premium';
import { useLocale } from '@/lib/i18n';
import { appLight, fonts } from '@/theme/tokens';
import { CheckGlyph, ChevronGlyph, LockGlyph, SpaceGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

/** Todas las clases por programa. Un programa se puede elegir arriba (o llegar elegido desde Inicio). */
export default function ClassesScreen() {
  const { t } = useTranslation();
  const palette = appLight;
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const practices = usePractices();
  const hasPremium = useHasPremium();
  const { programa } = useLocalSearchParams<{ programa?: string }>();
  const programs = useMemo(() => catalog(locale), [locale]);
  const practiced = useMemo(
    () => new Set(practices.map((practice) => practice.lessonSlug)),
    [practices],
  );
  const selected = programs.some((program) => program.slug === programa) ? programa : undefined;
  const shown = selected ? programs.filter((program) => program.slug === selected) : programs;
  const column = { width: '100%', maxWidth: 640, alignSelf: 'center' } as const;

  const filters: { slug: string | undefined; label: string }[] = [
    { slug: undefined, label: t('classes.all') },
    ...programs.map((program) => ({ slug: program.slug, label: program.title })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: TAB_BAR_HEIGHT + 32 }}
      >
        <View style={[column, { paddingHorizontal: layout.gutter, gap: 6 }]}>
          <Text
            accessibilityRole="header"
            color={palette.ink}
            style={{
              fontFamily: fonts.semibold,
              fontSize: layout.titleSize,
              lineHeight: layout.titleLine,
              letterSpacing: -0.8,
            }}
          >
            {t('classes.title')}
          </Text>
          <Text color={palette.muted} style={{ fontSize: 16, lineHeight: 22 }}>
            {t('classes.body')}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 18, flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: layout.gutter, gap: 8 }}
        >
          {filters.map((filter) => {
            const active = filter.slug === selected;
            return (
              <Squish
                key={filter.slug ?? 'all'}
                onPress={() => router.setParams({ programa: filter.slug })}
                haptic={!active}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={filter.label}
                style={{
                  height: 42,
                  paddingHorizontal: 18,
                  borderRadius: 21,
                  justifyContent: 'center',
                  backgroundColor: active ? palette.selected : palette.card,
                }}
              >
                <Text
                  weight="medium"
                  color={active ? palette.onSelected : palette.ink}
                  style={{ fontSize: 15, lineHeight: 19 }}
                >
                  {filter.label}
                </Text>
              </Squish>
            );
          })}
        </ScrollView>

        <View style={[column, { paddingHorizontal: layout.gutter, marginTop: 24, gap: 32 }]}>
          {shown.map((program, index) => (
            <Animated.View key={program.slug} entering={enter(index)}>
              <ProgramSection program={program} practiced={practiced} hasPremium={hasPremium} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ProgramSection({
  program,
  practiced,
  hasPremium,
}: {
  program: Program;
  practiced: ReadonlySet<string>;
  hasPremium: boolean;
}) {
  const { t } = useTranslation();
  const palette = appLight;
  const free = !program.isPremium && program.lessons.some((lesson) => !lesson.isPremium);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: palette.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SpaceGlyph mode={program.spaceMode} color={palette.ink} size={28} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            accessibilityRole="header"
            color={palette.ink}
            style={{
              fontFamily: fonts.semibold,
              fontSize: 20,
              lineHeight: 25,
              letterSpacing: -0.3,
            }}
          >
            {program.title}
          </Text>
          <Text color={palette.muted} style={{ fontSize: 14, lineHeight: 19 }}>
            {[
              t(`level.${program.level}`),
              t('classes.count', { count: program.lessons.length }),
            ].join(' · ')}
          </Text>
        </View>
        <View
          style={{
            height: 26,
            paddingHorizontal: 10,
            borderRadius: 13,
            justifyContent: 'center',
            backgroundColor: free ? palette.card : palette.accent,
          }}
        >
          <Text weight="semibold" color={palette.ink} style={{ fontSize: 12, lineHeight: 15 }}>
            {free ? t('classes.free') : t('classes.premium')}
          </Text>
        </View>
      </View>
      <Text color={palette.muted} style={{ fontSize: 15, lineHeight: 21 }}>
        {program.description}
      </Text>
      <View style={{ gap: 8 }}>
        {program.lessons.map((lesson) => (
          <LessonRow
            key={lesson.slug}
            lesson={lesson}
            done={practiced.has(lesson.slug)}
            locked={lesson.isPremium && !hasPremium}
          />
        ))}
      </View>
    </View>
  );
}

function LessonRow({ lesson, done, locked }: { lesson: Lesson; done: boolean; locked: boolean }) {
  const { t } = useTranslation();
  const palette = appLight;
  const minutes = t('common.minutes', { count: Math.round(lesson.durationSec / 60) });

  return (
    <Squish
      onPress={() => router.push({ pathname: '/clase/[slug]', params: { slug: lesson.slug } })}
      pressedScale={0.985}
      accessibilityLabel={[
        `${lesson.number}. ${lesson.title}`,
        minutes,
        done ? t('classes.done') : null,
        locked ? t('classes.premium') : null,
      ]
        .filter(Boolean)
        .join(', ')}
      style={{
        minHeight: 72,
        borderRadius: 20,
        backgroundColor: palette.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
        paddingLeft: 14,
        paddingRight: 12,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? palette.selected : palette.raised,
        }}
      >
        {done ? (
          <CheckGlyph color={palette.onSelected} size={18} strokeWidth={2.4} />
        ) : locked ? (
          <LockGlyph color={palette.faint} size={17} strokeWidth={2} />
        ) : (
          <Text weight="semibold" color={palette.ink} style={{ fontSize: 15, lineHeight: 18 }}>
            {lesson.number}
          </Text>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          weight="semibold"
          color={locked ? palette.muted : palette.ink}
          style={{ fontSize: 16, lineHeight: 21 }}
        >
          {lesson.title}
        </Text>
        <Text color={palette.muted} style={{ fontSize: 14, lineHeight: 18 }}>
          {done ? `${minutes} · ${t('classes.done')}` : minutes}
        </Text>
      </View>
      <ChevronGlyph color={palette.faint} size={20} />
    </Squish>
  );
}
