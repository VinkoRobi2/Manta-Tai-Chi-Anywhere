import { SPACE_MODES, tideWeek, type SpaceMode } from '@manta/shared';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { nextLessonFor, type LessonInfo } from '@/features/catalog/catalog';
import { formatBytes, isAnchored, useDownloads } from '@/features/downloads/downloads';
import { usePremium } from '@/features/paywall/purchases';
import { useSessions } from '@/features/sessions/sessions';
import { useSettings } from '@/features/settings/settings';
import { track } from '@/lib/analytics';
import { localeTag, useLocale } from '@/lib/i18n';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { AnchoredBadge, SpaceGlyph, TideWeek } from '@/ui/Marine';
import { Press } from '@/ui/Press';
import { IconButton, Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

function greetingKey(date: Date): 'morning' | 'afternoon' | 'evening' {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 19) return 'afternoon';
  return 'evening';
}

/** Una pincelada bajo el título, en Tinta. */
function BrushStroke() {
  const palette = useTheme();
  return (
    <Svg
      width={150}
      height={14}
      viewBox="0 0 150 14"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path
        d="M2 8 C 30 3, 70 2, 110 5 C 125 6, 140 8, 148 6 C 140 10, 120 11, 100 10 C 70 9, 35 11, 2 8 Z"
        fill={palette.ink}
        opacity={0.85}
      />
    </Svg>
  );
}

function SpaceOption({
  mode,
  lesson,
  first,
}: {
  mode: SpaceMode;
  lesson: LessonInfo;
  first: boolean;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const palette = useTheme();
  const downloads = useDownloads();
  const premium = usePremium();
  const night = palette.name === 'abisal';
  const anchored = isAnchored(lesson, downloads);
  const locked = lesson.isPremium && !premium;
  const minutes = t('common.minutes', { count: Math.round(lesson.durationSec / 60) });

  const open = () => {
    track('space_selected', { space: mode });
    router.push({ pathname: '/clase/[slug]', params: { slug: lesson.slug } });
  };
  const label = `${t(`space.${mode}.title`)}. ${t(`space.${mode}.body`)}. ${lesson.title}, ${minutes}.`;

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: night ? space.l : space.xl }}>
      <SpaceGlyph mode={mode} size={night ? 60 : 62} />
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Text variant={night ? 'headline' : 'title'}>{t(`space.${mode}.title`)}</Text>
        <Text variant="callout" tone="soft">
          {t(`space.${mode}.body`)} · {t(`space.${mode}.measure`)}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            columnGap: space.s,
            rowGap: 2,
            marginTop: 4,
          }}
        >
          <Text variant="caption" weight="bold">
            {lesson.title} · {minutes}
          </Text>
          {anchored ? (
            <AnchoredBadge />
          ) : locked ? (
            <Text variant="caption" tone="soft">
              {t('classes.premium')}
            </Text>
          ) : (
            <Text variant="caption" tone="soft">
              {formatBytes(lesson.packageBytes, localeTag(locale))}
            </Text>
          )}
        </View>
      </View>
      {night ? null : (
        <Icon name="chevronRight" size={18} color={first ? palette.accent : palette.inkSoft} />
      )}
    </View>
  );

  if (night) {
    return (
      <Card onPress={open} highlighted={first} accessibilityLabel={label}>
        {content}
      </Card>
    );
  }
  return (
    <Press
      haptic
      onPress={open}
      accessibilityLabel={label}
      style={{
        paddingVertical: space.l,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        overflow: 'hidden',
      }}
    >
      {content}
    </Press>
  );
}

export default function TodayScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const palette = useTheme();
  const sessions = useSessions();
  const { weeklyGoal } = useSettings();
  const night = palette.name === 'abisal';
  const now = new Date();

  const practiced = useMemo(
    () => new Set(sessions.map((session) => session.lessonSlug)),
    [sessions],
  );
  const week = useMemo(() => tideWeek(sessions, new Date(), weeklyGoal), [sessions, weeklyGoal]);
  const date = new Intl.DateTimeFormat(localeTag(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  return (
    <Screen
      title={t('tabs.today')}
      largeTitle={false}
      right={
        <IconButton
          name="settings"
          label={t('home.settings')}
          onPress={() => router.push('/ajustes')}
        />
      }
    >
      <View style={{ gap: space.s, marginTop: space.s }}>
        {night ? (
          <Text variant="callout" tone="soft" weight="semibold">
            {t(`greeting.${greetingKey(now)}`)}
          </Text>
        ) : (
          <Text variant="label" tone="soft">
            {date}
          </Text>
        )}
        <Text
          variant="display"
          accessibilityRole="header"
          style={night ? undefined : { fontSize: 46, lineHeight: 47 }}
        >
          {t('home.title')}
        </Text>
        {night ? null : <BrushStroke />}
      </View>

      <View
        style={{
          gap: night ? space.m : 0,
          borderBottomWidth: night ? 0 : 1,
          borderBottomColor: palette.border,
        }}
      >
        {SPACE_MODES.map((mode, index) => (
          <SpaceOption
            key={mode}
            mode={mode}
            first={index === 0}
            lesson={nextLessonFor(mode, locale, practiced)}
          />
        ))}
      </View>

      {sessions.length > 0 ? (
        <View style={{ marginTop: space.s }}>
          <TideWeek
            week={week}
            title={week.reached ? t('tides.weekComplete') : t('tides.titleWeek')}
            subtitle={t('tides.count', { count: week.count, goal: week.goal })}
          />
        </View>
      ) : (
        <Text variant="callout" tone="soft" align="center" style={{ marginTop: space.s }}>
          {t('home.firstTime')}
        </Text>
      )}
    </Screen>
  );
}
