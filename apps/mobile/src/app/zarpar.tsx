import { planVoyage, VOYAGE_DAYS, type VoyageDays } from '@manta/shared';
import { Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { getLessons } from '@/features/catalog/catalog';
import {
  anchorLessons,
  anchorStatus,
  formatBytes,
  isAnchored,
  useDownloads,
} from '@/features/downloads/downloads';
import { usePremium } from '@/features/paywall/purchases';
import { track } from '@/lib/analytics';
import { localeTag, useLocale } from '@/lib/i18n';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { ListRow } from '@/ui/ListRow';
import { ProgressRing } from '@/ui/Marine';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';

function freeDiskSpace(): number | null {
  try {
    const bytes = Paths.availableDiskSpace;
    return Number.isFinite(bytes) && bytes > 0 ? bytes : null;
  } catch {
    return null;
  }
}

/** Para quien se va días sin señal: elige los días y Manta ancla un plan entero. */
export default function VoyageScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const palette = useTheme();
  const downloads = useDownloads();
  const premium = usePremium();
  const tag = localeTag(locale);
  const [days, setDays] = useState<VoyageDays>(21);
  const [freeBytes] = useState(freeDiskSpace);

  const candidates = useMemo(
    () =>
      getLessons(locale).map((lesson) => ({
        ...lesson,
        sizeBytes: lesson.packageBytes,
        anchored: isAnchored(lesson, downloads),
        accessible: !lesson.isPremium || premium,
      })),
    [locale, downloads, premium],
  );
  const plan = planVoyage(days, candidates);
  const fullPlanCount = planVoyage(
    days,
    candidates.map((lesson) => ({ ...lesson, accessible: true })),
  ).lessons.length;

  const statuses = plan.lessons.map((lesson) => anchorStatus(lesson, downloads));
  const anchoredCount = statuses.filter((status) => status.kind === 'anchored').length;
  const busy = statuses.some((status) => status.kind === 'downloading' || status.kind === 'queued');
  const allAnchored = anchoredCount === plan.lessons.length;
  const doneBytes = plan.lessons.reduce((sum, lesson, index) => {
    const status = statuses[index];
    if (status?.kind === 'anchored') return sum + lesson.packageBytes;
    if (status?.kind === 'downloading') return sum + status.receivedBytes;
    return sum;
  }, 0);
  const percent = plan.totalBytes > 0 ? Math.round((doneBytes / plan.totalBytes) * 100) : 100;
  const missingBytes = Math.max(0, plan.totalBytes - doneBytes);

  const spaces = [
    ...new Set(plan.lessons.map((lesson) => t(`space.${lesson.spaceMode}.title`))),
  ].join(', ');

  const anchorAll = () => {
    anchorLessons(plan.lessons);
    track('voyage_prepared', { days, lessons: plan.lessons.length });
  };

  return (
    <Screen title={t('voyage.title')} back>
      <Text variant="callout" weight="medium">
        {t('voyage.question')}
      </Text>
      <Segmented
        accessibilityLabel={t('voyage.question')}
        value={String(days)}
        onChange={(value) => setDays(Number(value) as VoyageDays)}
        options={VOYAGE_DAYS.map((value) => ({
          value: String(value),
          label: t('voyage.days', { count: value }),
        }))}
      />

      <Card padded={false} style={{ paddingHorizontal: space.l, paddingTop: space.l }}>
        <Text variant="headline" weight="semibold">
          {t('voyage.plan', { count: days })}
        </Text>
        <Text variant="caption" tone="soft">
          {t('voyage.planBody', { count: plan.lessons.length, spaces })}
        </Text>
        <View style={{ marginTop: space.s }}>
          {plan.lessons.map((lesson, index) => {
            const status = statuses[index];
            let left;
            let right;
            if (status?.kind === 'anchored') {
              left = (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: palette.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="check" size={14} color={palette.onAccent} />
                </View>
              );
              right = (
                <Text variant="caption" tone="accent" weight="semibold">
                  {t('common.anchored')}
                </Text>
              );
            } else if (status?.kind === 'downloading') {
              left = <ProgressRing progress={status.progress} size={28} />;
              right = (
                <Text variant="caption" tone="soft" style={{ fontVariant: ['tabular-nums'] }}>
                  {formatBytes(status.receivedBytes, tag)} / {formatBytes(lesson.packageBytes, tag)}
                </Text>
              );
            } else {
              left = (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: palette.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="download" size={14} color={palette.inkSoft} />
                </View>
              );
              right = (
                <Text variant="caption" tone="soft">
                  {status?.kind === 'queued'
                    ? t('voyage.waiting')
                    : formatBytes(lesson.packageBytes, tag)}
                </Text>
              );
            }
            return (
              <ListRow
                key={lesson.slug}
                divider
                left={left}
                right={right}
                title={lesson.title}
                subtitle={`${t(`space.${lesson.spaceMode}.title`)} · ${t('common.minutes', { count: Math.round(lesson.durationSec / 60) })}`}
              />
            );
          })}
        </View>
      </Card>

      {plan.limitedByAccess ? (
        <Card>
          <Text variant="callout">{t('voyage.limited', { count: fullPlanCount })}</Text>
          <Button
            label={t('voyage.limitedCta')}
            variant="quiet"
            size="small"
            block={false}
            onPress={() => router.push('/manta-completa')}
            style={{ marginTop: space.s, paddingHorizontal: 0 }}
          />
        </Card>
      ) : null}

      <View style={{ gap: space.s }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: space.s,
          }}
        >
          <Text variant="caption" tone="soft">
            {t('voyage.total', { size: formatBytes(plan.totalBytes, tag) })}
            {missingBytes > 0
              ? ` · ${t('voyage.toDownload', { size: formatBytes(missingBytes, tag) })}`
              : ''}
          </Text>
          {freeBytes ? (
            <Text variant="caption" tone="soft">
              {t('voyage.free', { size: formatBytes(freeBytes, tag) })}
            </Text>
          ) : null}
        </View>
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: palette.surfaceAlt,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${percent}%`,
              height: '100%',
              backgroundColor: palette.accent,
              borderRadius: 3,
            }}
          />
        </View>
      </View>

      {allAnchored ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.s,
            paddingVertical: space.m,
          }}
          accessibilityLiveRegion="polite"
        >
          <Icon name="sailboat" size={22} color={palette.accent} />
          <Text variant="body" weight="semibold">
            {t('voyage.done')}
          </Text>
        </View>
      ) : busy ? (
        <View style={{ gap: space.s }}>
          <Button label={t('voyage.anchoring', { percent })} variant="tonal" loading />
          <Text variant="caption" tone="soft" align="center">
            {t('voyage.canLeave')}
          </Text>
        </View>
      ) : (
        <Button label={t('voyage.anchorAll')} icon="anchor" onPress={anchorAll} />
      )}
    </Screen>
  );
}
