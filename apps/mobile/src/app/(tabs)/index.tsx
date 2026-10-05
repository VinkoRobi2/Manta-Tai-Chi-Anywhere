import { SPACE_MODES, tideWeek, type SpaceMode } from '@manta/shared';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { nextLessonFor, type LessonInfo } from '@/features/catalog/catalog';
import { formatBytes, isAnchored, useDownloads } from '@/features/downloads/downloads';
import { usePremium } from '@/features/paywall/purchases';
import { useSessions } from '@/features/sessions/sessions';
import { useSettings } from '@/features/settings/settings';
import { track } from '@/lib/analytics';
import { localeTag, useLocale } from '@/lib/i18n';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';
import { Wordmark } from '@/ui/Brand';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { AnchoredBadge, SpacePlan, TideWeek } from '@/ui/Marine';
import { IconButton, Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

function greetingKey(date: Date): 'morning' | 'afternoon' | 'evening' {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 19) return 'afternoon';
  return 'evening';
}

function SpaceCard({ mode, lesson }: { mode: SpaceMode; lesson: LessonInfo }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const palette = useTheme();
  const downloads = useDownloads();
  const premium = usePremium();
  const anchored = isAnchored(lesson, downloads);
  const locked = lesson.isPremium && !premium;
  const minutes = t('common.minutes', { count: Math.round(lesson.durationSec / 60) });

  return (
    <Card
      onPress={() => {
        track('space_selected', { space: mode });
        router.push({ pathname: '/clase/[slug]', params: { slug: lesson.slug } });
      }}
      accessibilityLabel={`${t(`space.${mode}.title`)}. ${t(`space.${mode}.body`)}. ${lesson.title}, ${minutes}.`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="headline" weight="semibold">
            {t(`space.${mode}.title`)}
          </Text>
          <Text variant="callout" tone="soft">
            {t(`space.${mode}.body`)}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              columnGap: space.s,
              rowGap: 2,
              marginTop: space.s,
            }}
          >
            <Text variant="caption" tone="soft">
              {lesson.title} · {minutes}
            </Text>
            {anchored ? (
              <AnchoredBadge />
            ) : locked ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="lock" size={12} color={palette.inkSoft} />
                <Text variant="caption" tone="soft">
                  {t('classes.premium')}
                </Text>
              </View>
            ) : (
              <Text variant="caption" tone="soft">
                {formatBytes(lesson.packageBytes, localeTag(locale))}
              </Text>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <SpacePlan mode={mode} size={60} />
          <Text variant="caption" tone="soft" style={{ fontSize: 12 }}>
            {t(`space.${mode}.measure`)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export default function TodayScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const sessions = useSessions();
  const { weeklyGoal } = useSettings();
  const now = new Date();
  const ios = Platform.OS !== 'android';

  const practiced = useMemo(
    () => new Set(sessions.map((session) => session.lessonSlug)),
    [sessions],
  );
  const week = useMemo(() => tideWeek(sessions, new Date(), weeklyGoal), [sessions, weeklyGoal]);

  return (
    <Screen
      title={t('tabs.today')}
      largeTitle={false}
      androidTitle={<Wordmark />}
      right={
        <IconButton
          name="settings"
          label={t('home.settings')}
          onPress={() => router.push('/ajustes')}
        />
      }
    >
      <View style={{ gap: 4 }}>
        <Text variant="callout" tone="soft" weight="medium">
          {t(`greeting.${greetingKey(now)}`)}
        </Text>
        <Text
          variant={ios ? 'display' : 'title'}
          weight={ios ? 'semibold' : 'medium'}
          accessibilityRole="header"
        >
          {t('home.title')}
        </Text>
      </View>

      <View style={{ gap: space.m }}>
        {SPACE_MODES.map((mode) => (
          <SpaceCard key={mode} mode={mode} lesson={nextLessonFor(mode, locale, practiced)} />
        ))}
      </View>

      {sessions.length > 0 ? (
        <Card>
          <TideWeek
            week={week}
            title={
              week.reached
                ? t('tides.weekComplete')
                : t('tides.count', { count: week.count, goal: week.goal })
            }
            subtitle={t('tides.thisWeek')}
          />
        </Card>
      ) : (
        <Text variant="callout" tone="soft" align="center" style={{ marginTop: space.s }}>
          {t('home.firstTime')}
        </Text>
      )}
    </Screen>
  );
}
