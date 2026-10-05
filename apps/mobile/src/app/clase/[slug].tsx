import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLesson, loadTimeline } from '@/features/catalog/catalog';
import {
  anchorLessons,
  anchorStatus,
  formatBytes,
  useDownloads,
} from '@/features/downloads/downloads';
import { usePremium } from '@/features/paywall/purchases';
import { CARE_TAGS, updateSettings, useSettings, type CareTag } from '@/features/settings/settings';
import { track } from '@/lib/analytics';
import { localeTag, useLocale } from '@/lib/i18n';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { AnchoredBadge } from '@/ui/Marine';
import { Press } from '@/ui/Press';
import { IconButton } from '@/ui/Screen';
import { Text } from '@/ui/Text';

/** Hoja de clase: todo lo necesario para empezar, nada más. */
export default function LessonSheet() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const locale = useLocale();
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const premium = usePremium();
  const downloads = useDownloads();

  const lesson = getLesson(slug, locale);
  const timeline = lesson ? loadTimeline(lesson.slug, locale) : null;

  useEffect(() => {
    track('lesson_sheet_opened', { lesson: slug });
  }, [slug]);

  if (!lesson || !timeline) {
    return (
      <View style={{ padding: space.xl }}>
        <Text>{t('lesson.notFound')}</Text>
      </View>
    );
  }

  const status = anchorStatus(lesson, downloads);
  const locked = lesson.isPremium && !premium;
  const minutes = t('common.minutes', { count: Math.round(lesson.durationSec / 60) });

  const toggleCare = (tag: CareTag) => {
    const current = settings.careTags;
    updateSettings({
      careTags: current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    });
  };

  const start = (voiceOnly: boolean) => {
    updateSettings({ safetySeen: true });
    router.replace({
      pathname: '/reproductor/[slug]',
      params: { slug: lesson.slug, voz: voiceOnly ? '1' : '0' },
    });
  };

  let action;
  if (locked) {
    action = (
      <Button
        label={t('lesson.unlock')}
        icon="lock"
        onPress={() => router.push('/manta-completa')}
      />
    );
  } else if (status.kind === 'anchored') {
    action = (
      <View style={{ gap: space.xs }}>
        <Button label={t('lesson.start')} icon="play" onPress={() => start(false)} />
        <Button
          label={t('lesson.voiceOnly')}
          icon="voice"
          variant="quiet"
          size="medium"
          block
          onPress={() => start(true)}
          accessibilityHint={t('lesson.voiceOnlyHint')}
        />
      </View>
    );
  } else if (status.kind === 'remote') {
    action = (
      <Button
        label={t('lesson.anchor', { size: formatBytes(lesson.packageBytes, localeTag(locale)) })}
        icon="download"
        variant="tonal"
        onPress={() => anchorLessons([lesson])}
      />
    );
  } else {
    const percent = status.kind === 'downloading' ? Math.round(status.progress * 100) : 0;
    action = <Button label={t('lesson.anchoring', { percent })} variant="tonal" loading />;
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: space.xl,
        paddingTop: Platform.OS === 'android' ? space.l : space.xl,
        paddingBottom: insets.bottom + space.xl,
        gap: space.m,
      }}
    >
      {Platform.OS === 'android' ? (
        <View
          style={{
            alignSelf: 'center',
            width: 32,
            height: 4,
            borderRadius: 2,
            backgroundColor: palette.inkSoft,
            opacity: 0.5,
            marginBottom: space.s,
          }}
        />
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="label" tone="accent">
            {t(`space.${lesson.spaceMode}.title`)} · {t(`level.${lesson.level}`)}
          </Text>
          <Text variant="title" accessibilityRole="header">
            {lesson.title}
          </Text>
        </View>
        {Platform.OS === 'ios' ? (
          <IconButton name="close" label={t('common.close')} onPress={() => router.back()} />
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: space.s,
          rowGap: 4,
          marginTop: -4,
        }}
      >
        <Text variant="callout" tone="soft">
          {minutes} · {t('lesson.movements', { count: timeline.segments.length })}
        </Text>
        {status.kind === 'anchored' ? <AnchoredBadge /> : null}
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: palette.border }}>
        {timeline.segments.map((segment, index) => (
          <View
            key={`${segment.clip}-${segment.startMs}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.m,
              minHeight: 52,
              borderBottomWidth: 1,
              borderBottomColor: palette.border,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: palette.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="caption" tone="accent" weight="semibold">
                {index + 1}
              </Text>
            </View>
            <Text variant="callout" style={{ flex: 1 }}>
              {segment.title}
            </Text>
            <Text variant="caption" tone="soft" style={{ fontVariant: ['tabular-nums'] }}>
              {Math.floor(segment.durationMs / 60000)}:
              {String(Math.round((segment.durationMs % 60000) / 1000)).padStart(2, '0')}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="callout" weight="medium" style={{ marginTop: space.s }}>
        {t('lesson.careTitle')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
        {CARE_TAGS.map((tag) => (
          <Chip
            key={tag}
            label={t(`lesson.care.${tag}`)}
            selected={settings.careTags.includes(tag)}
            onPress={() => toggleCare(tag)}
          />
        ))}
      </View>

      <View style={{ marginTop: space.m }}>{action}</View>

      {!settings.safetySeen ? (
        <Press
          onPress={() => router.push('/salud')}
          accessibilityRole="link"
          style={{ alignSelf: 'center', paddingVertical: space.s }}
        >
          <Text variant="caption" tone="soft" align="center">
            {t('lesson.safety')}{' '}
            <Text variant="caption" tone="accent" weight="semibold">
              {t('lesson.safetyMore')}
            </Text>
          </Text>
        </Press>
      ) : null}
    </ScrollView>
  );
}
