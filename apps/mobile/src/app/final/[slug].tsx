import { SEA_STATES, type SeaState } from '@manta/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { getLesson, nextLessonFor } from '@/features/catalog/catalog';
import { usePremium } from '@/features/paywall/purchases';
import { enableReminder, formatTime, roundedNow } from '@/features/reminders/reminders';
import { maybeAskForReview } from '@/features/review/review';
import { setSessionMood, useSessions } from '@/features/sessions/sessions';
import { updateSettings, useSettings } from '@/features/settings/settings';
import { track } from '@/lib/analytics';
import { localeTag, useLocale } from '@/lib/i18n';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { SeaStateIcon } from '@/ui/Marine';
import { Press } from '@/ui/Press';
import { IconButton } from '@/ui/Screen';
import { Text } from '@/ui/Text';

/** Mar en calma con el sol en el horizonte y un barco pesquero a lo lejos. */
function CalmSea({ height }: { height: number }) {
  const palette = useTheme();
  const dark = palette.scheme === 'dark';
  return (
    <Svg width="100%" height={height} viewBox="0 0 300 160" preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={dark ? '#0B3C49' : '#BFDCE2'} />
          <Stop offset="1" stopColor={dark ? '#145466' : '#E4EFF1'} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={300} height={116} fill="url(#sky)" />
      <Circle cx={214} cy={116} r={27} fill={palette.sol} />
      <Rect x={0} y={116} width={300} height={44} fill={dark ? '#1F5A68' : '#7DB6C2'} />
      <Path d="M0 116h300" stroke="#EEF4F5" strokeOpacity={0.9} strokeWidth={1.2} />
      <Path
        d="M200 124h28M204 131h20M208 138h12"
        stroke={palette.sol}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.85}
      />
      <Path
        d="M18 128h54M110 134h66M244 126h40M34 144h84M166 149h62"
        stroke="#EEF4F5"
        strokeOpacity={0.7}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path d="M58 116h30l-5 6H63z" fill="#0B3C49" />
      <Path d="M72 116V99" stroke="#0B3C49" strokeWidth={1.4} />
      <Path d="M72 101l9 13h-9z" fill="#0B3C49" opacity={0.75} />
    </Svg>
  );
}

export default function FinalScreen() {
  const { slug, sesion, segundos } = useLocalSearchParams<{
    slug: string;
    sesion?: string;
    segundos?: string;
  }>();
  const { t } = useTranslation();
  const locale = useLocale();
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const premium = usePremium();
  const sessions = useSessions();
  const ios = Platform.OS !== 'android';

  const lesson = getLesson(slug, locale);
  const minutes = Math.max(1, Math.round(Number(segundos ?? 0) / 60));
  const [mood, setMood] = useState<SeaState | null>(null);
  const [reminder, setReminder] = useState<'ask' | 'set' | 'denied' | 'hidden'>(() =>
    settings.reminderAsked || settings.reminder.enabled ? 'hidden' : 'ask',
  );
  const [time] = useState(() => roundedNow());
  const timeLabel = formatTime(time.hour, time.minute, localeTag(locale));

  const next = useMemo(() => {
    if (!lesson) return null;
    const practiced = new Set(sessions.map((session) => session.lessonSlug));
    const candidate = nextLessonFor(lesson.spaceMode, locale, practiced);
    return candidate.slug === lesson.slug ? null : candidate;
  }, [lesson, locale, sessions]);

  const chooseMood = (value: SeaState) => {
    setMood(value);
    if (sesion) setSessionMood(sesion, value);
    track('mood_logged', { mood: value });
    void maybeAskForReview(value);
  };

  const acceptReminder = async () => {
    const ok = await enableReminder(time.hour, time.minute, {
      title: t('notification.title'),
      body: t('notification.body'),
      channel: t('notification.channel'),
    });
    setReminder(ok ? 'set' : 'denied');
    if (ok) track('reminder_enabled', { hour: time.hour });
  };

  const close = () => router.back();

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}>
        <CalmSea height={insets.top + 190} />

        <Animated.View
          entering={FadeInDown.duration(700)}
          style={{ paddingHorizontal: space.gutter, gap: space.l, marginTop: space.l }}
        >
          <View>
            <Text
              variant="display"
              accessibilityRole="header"
              style={{ fontSize: 40, lineHeight: 46 }}
            >
              {t('final.title')}
            </Text>
            <Text variant="body" tone="soft">
              {t('final.minutes', { count: minutes })}
            </Text>
          </View>

          <View style={{ gap: space.s }}>
            <Text variant="callout" weight="medium">
              {t('final.moodQuestion')}
            </Text>
            <View
              style={{ flexDirection: 'row', gap: space.s }}
              accessibilityRole="radiogroup"
              accessibilityLabel={t('final.moodQuestion')}
            >
              {SEA_STATES.map((state) => {
                const selected = mood === state;
                return (
                  <Press
                    key={state}
                    haptic
                    onPress={() => chooseMood(state)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t(`mood.${state}`)}
                    style={{
                      flex: 1,
                      minHeight: 76,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingHorizontal: 2,
                      borderRadius: ios ? 16 : 12,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? palette.accent : palette.border,
                      backgroundColor: selected ? palette.surfaceAlt : palette.surface,
                      overflow: 'hidden',
                    }}
                  >
                    <SeaStateIcon state={state} width={34} />
                    <Text
                      variant="caption"
                      align="center"
                      style={{ fontSize: 12, lineHeight: 15 }}
                      numberOfLines={2}
                    >
                      {t(`mood.${state}`)}
                    </Text>
                  </Press>
                );
              })}
            </View>
          </View>

          {reminder !== 'hidden' ? (
            <Animated.View entering={FadeIn}>
              <Card>
                <View style={{ flexDirection: 'row', gap: space.m }}>
                  <Icon name="bell" size={22} color={palette.accent} />
                  <View style={{ flex: 1, gap: space.m }}>
                    {reminder === 'ask' ? (
                      <>
                        <Text variant="callout" weight="semibold">
                          {t('final.reminderQuestion')}
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
                          <Button
                            label={t('final.reminderYes', { time: timeLabel })}
                            variant="secondary"
                            size="small"
                            onPress={acceptReminder}
                          />
                          <Button
                            label={t('final.reminderOther')}
                            variant="outline"
                            size="small"
                            onPress={() => {
                              updateSettings({ reminderAsked: true });
                              router.push('/ajustes');
                            }}
                          />
                        </View>
                      </>
                    ) : (
                      <Text variant="callout">
                        {reminder === 'set'
                          ? t('final.reminderSet', { time: timeLabel })
                          : t('final.reminderDenied')}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            </Animated.View>
          ) : null}

          {settings.sessionsCompleted >= 2 && !premium ? (
            <Card
              onPress={() => router.push('/manta-completa')}
              accessibilityLabel={`${t('final.premiumTitle')}. ${t('final.premiumBody')}`}
            >
              <Text variant="callout" weight="semibold">
                {t('final.premiumTitle')}
              </Text>
              <Text variant="caption" tone="soft" style={{ marginTop: 2 }}>
                {t('final.premiumBody')}
              </Text>
              <Text
                variant="caption"
                tone="accent"
                weight="semibold"
                style={{ marginTop: space.s }}
              >
                {t('final.premiumCta')}
              </Text>
            </Card>
          ) : null}

          {next ? (
            <Press
              haptic
              onPress={() =>
                router.replace({ pathname: '/clase/[slug]', params: { slug: next.slug } })
              }
              accessibilityLabel={`${t('final.next')}: ${next.title}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.m,
                minHeight: 64,
                borderTopWidth: 1,
                borderTopColor: palette.border,
                overflow: 'hidden',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text variant="label" tone="soft">
                  {t('final.next')}
                </Text>
                <Text variant="callout" weight="medium">
                  {next.title} · {t('common.minutes', { count: Math.round(next.durationSec / 60) })}
                </Text>
              </View>
              <Icon name="chevronRight" size={18} color={palette.accent} />
            </Press>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          top: insets.top + space.s,
          left: space.m,
          right: space.m,
          flexDirection: 'row',
          justifyContent: ios ? 'flex-end' : 'flex-start',
        }}
      >
        {ios ? (
          <Press
            onPress={close}
            accessibilityLabel={t('common.done')}
            style={{
              minHeight: 44,
              paddingHorizontal: space.m,
              justifyContent: 'center',
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.7)',
            }}
          >
            <Text variant="callout" weight="semibold" color="#0B3C49">
              {t('common.done')}
            </Text>
          </Press>
        ) : (
          <IconButton name="close" label={t('common.close')} onPress={close} color="#0B3C49" />
        )}
      </View>
    </View>
  );
}
