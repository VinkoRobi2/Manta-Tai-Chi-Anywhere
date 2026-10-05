import { SPACE_MODES, type SpaceMode } from '@manta/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { getPrograms, type LessonInfo } from '@/features/catalog/catalog';
import { anchorStatus, formatBytes, useDownloads } from '@/features/downloads/downloads';
import { usePremium } from '@/features/paywall/purchases';
import { localeTag, useLocale } from '@/lib/i18n';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { ListRow } from '@/ui/ListRow';
import { AnchoredBadge, ProgressRing, SpacePlan } from '@/ui/Marine';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';

function LessonRow({ lesson, divider }: { lesson: LessonInfo; divider: boolean }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const palette = useTheme();
  const downloads = useDownloads();
  const premium = usePremium();
  const status = anchorStatus(lesson, downloads);
  const locked = lesson.isPremium && !premium;

  let right;
  if (locked) right = <Icon name="lock" size={16} color={palette.inkSoft} />;
  else if (status.kind === 'anchored') right = <AnchoredBadge />;
  else if (status.kind === 'downloading') right = <ProgressRing progress={status.progress} />;
  else
    right = (
      <Text variant="caption" tone="soft">
        {formatBytes(lesson.packageBytes, localeTag(locale))}
      </Text>
    );

  return (
    <ListRow
      divider={divider}
      title={lesson.title}
      subtitle={`${t('common.minutes', { count: Math.round(lesson.durationSec / 60) })} · ${lesson.summary}`}
      right={right}
      onPress={() => router.push({ pathname: '/clase/[slug]', params: { slug: lesson.slug } })}
    />
  );
}

export default function ClassesScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const palette = useTheme();
  const [mode, setMode] = useState<SpaceMode>('SEATED');
  const programs = getPrograms(locale).filter((program) => program.spaceMode === mode);

  return (
    <Screen title={t('classes.title')}>
      <Segmented
        accessibilityLabel={t('home.title')}
        value={mode}
        onChange={setMode}
        options={SPACE_MODES.map((value) => ({ value, label: t(`space.${value}.title`) }))}
      />

      <Card
        onPress={() => router.push('/zarpar')}
        accessibilityLabel={`${t('classes.voyageTitle')}. ${t('classes.voyageBody')}`}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: palette.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="sailboat" size={24} color={palette.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="callout" weight="semibold">
              {t('classes.voyageTitle')}
            </Text>
            <Text variant="caption" tone="soft">
              {t('classes.voyageBody')}
            </Text>
          </View>
          <Icon name="chevronRight" size={16} color={palette.inkSoft} />
        </View>
      </Card>

      {programs.map((program) => (
        <View key={program.slug} style={{ gap: space.s }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, marginTop: space.s }}
          >
            <SpacePlan mode={program.spaceMode} size={44} />
            <View style={{ flex: 1 }}>
              <Text variant="headline" weight="semibold" accessibilityRole="header">
                {program.title}
              </Text>
              <Text variant="caption" tone="soft">
                {t(`level.${program.level}`)} · {program.description}
              </Text>
            </View>
          </View>
          <Card style={{ paddingVertical: 0 }}>
            {program.lessons.map((lesson, index) => (
              <LessonRow key={lesson.slug} lesson={lesson} divider={index > 0} />
            ))}
          </Card>
          {program.isPremium ? (
            <Text variant="caption" tone="soft" style={{ marginLeft: space.xs }}>
              {t('classes.premium')}
            </Text>
          ) : null}
        </View>
      ))}
    </Screen>
  );
}
