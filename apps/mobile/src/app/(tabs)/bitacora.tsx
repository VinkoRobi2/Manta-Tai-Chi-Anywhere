import { groupByDay, practiceTotals, tideWeek } from '@manta/shared';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { getLessons } from '@/features/catalog/catalog';
import { useSessions } from '@/features/sessions/sessions';
import { useSettings } from '@/features/settings/settings';
import { localeTag, useLocale } from '@/lib/i18n';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';
import { MantaMark } from '@/ui/Brand';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { SeaStateIcon, TideWeek } from '@/ui/Marine';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

function Stat({
  value,
  label,
  compact = false,
}: {
  value: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <Card style={{ flex: 1, padding: space.m, gap: 2 }}>
      <Text
        variant={compact ? 'callout' : 'headline'}
        weight="semibold"
        numberOfLines={2}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
      <Text variant="caption" tone="soft" style={{ fontSize: 12, lineHeight: 15 }}>
        {label}
      </Text>
    </Card>
  );
}

/** La bitácora del barco, en versión amable: cada práctica anotada, sin culpas. */
export default function LogScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const palette = useTheme();
  const sessions = useSessions();
  const { weeklyGoal } = useSettings();
  const tag = localeTag(locale);

  const now = new Date();
  const week = useMemo(() => tideWeek(sessions, new Date(), weeklyGoal), [sessions, weeklyGoal]);
  const totals = useMemo(() => practiceTotals(sessions, new Date()), [sessions]);
  const days = useMemo(() => groupByDay(sessions), [sessions]);
  const titles = useMemo(
    () => new Map(getLessons(locale).map((lesson) => [lesson.slug, lesson.title])),
    [locale],
  );

  const dayFormat = new Intl.DateTimeFormat(tag, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeFormat = new Intl.DateTimeFormat(tag, { hour: '2-digit', minute: '2-digit' });
  const monthName = new Intl.DateTimeFormat(tag, { month: 'long' }).format(now);
  const todayKey = now.toDateString();

  if (sessions.length === 0) {
    return (
      <Screen title={t('log.title')}>
        <View style={{ alignItems: 'center', gap: space.l, paddingVertical: space.xxxl }}>
          <MantaMark width={72} />
          <Text variant="body" tone="soft" align="center" style={{ maxWidth: 280 }}>
            {t('log.empty')}
          </Text>
          <Button
            label={t('log.emptyCta')}
            size="medium"
            block={false}
            onPress={() => router.navigate('/')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title={t('log.title')}>
      <View style={{ flexDirection: 'row', gap: space.s }}>
        <Stat
          value={t('common.minutes', { count: totals.weekMinutes })}
          label={t('log.weekMinutes')}
        />
        <Stat
          value={t('common.minutes', { count: totals.monthMinutes })}
          label={t('log.monthMinutes', { month: monthName })}
        />
        <Stat
          value={totals.frequentMood ? t(`mood.${totals.frequentMood}`) : t('log.noMood')}
          label={t('log.frequentMood')}
          compact
        />
      </View>

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

      {days.map((day) => (
        <View key={day.key} style={{ gap: space.s }}>
          <Text variant="label" tone="soft" style={{ marginLeft: space.xs }}>
            {day.date.toDateString() === todayKey
              ? `${t('log.today')} · ${dayFormat.format(day.date)}`
              : dayFormat.format(day.date)}
          </Text>
          <Card padded={false}>
            {day.records.map((record, index) => (
              <View
                key={record.id}
                accessible
                accessibilityLabel={`${timeFormat.format(record.completedAt)}, ${titles.get(record.lessonSlug) ?? record.lessonSlug}, ${t('common.minutes', { count: Math.round(record.durationSec / 60) })}${record.mood ? `, ${t(`mood.${record.mood}`)}` : ''}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.m,
                  paddingHorizontal: space.l,
                  minHeight: 64,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: palette.border,
                }}
              >
                <Text
                  variant="caption"
                  tone="soft"
                  style={{ width: 48, fontVariant: ['tabular-nums'] }}
                >
                  {timeFormat.format(record.completedAt)}
                </Text>
                <View style={{ flex: 1, paddingVertical: space.s }}>
                  <Text variant="callout" weight="medium">
                    {titles.get(record.lessonSlug) ?? record.lessonSlug}
                  </Text>
                  <Text variant="caption" tone="soft">
                    {t('log.entry', {
                      minutes: Math.round(record.durationSec / 60),
                      space: t(`space.${record.spaceMode}.title`),
                    })}
                    {record.mood ? ` · ${t(`mood.${record.mood}`)}` : ''}
                  </Text>
                </View>
                {record.mood ? <SeaStateIcon state={record.mood} /> : null}
              </View>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}
