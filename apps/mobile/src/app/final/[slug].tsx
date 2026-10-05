import { SEA_STATES, type SeaState } from '@manta/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLesson, nextLessonFor } from '@/features/catalog/catalog';
import { usePremium } from '@/features/paywall/purchases';
import { enableReminder, formatTime, roundedNow } from '@/features/reminders/reminders';
import { maybeAskForReview } from '@/features/review/review';
import { setSessionMood, useSessions } from '@/features/sessions/sessions';
import { updateSettings, useSettings } from '@/features/settings/settings';
import { track } from '@/lib/analytics';
import { localeTag, useLocale } from '@/lib/i18n';
import { useTheme } from '@/theme/theme';
import { glowShadow, space } from '@/theme/tokens';
import { Enso, GlidingManta } from '@/ui/Brand';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Seal, SeaStateIcon } from '@/ui/Marine';
import { Press } from '@/ui/Press';
import { Backdrop, IconButton } from '@/ui/Screen';
import { Text } from '@/ui/Text';

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
  const night = palette.name === 'abisal';
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

  const reminderBody =
    reminder === 'ask' ? (
      <>
        <Text variant={night ? 'callout' : 'headline'} weight="bold">
          {t('final.reminderQuestion', { time: timeLabel })}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
          <Button
            label={t('final.reminderYes')}
            variant={night ? 'primary' : 'secondary'}
            size="small"
            block={false}
            onPress={acceptReminder}
          />
          <Button
            label={t('final.reminderOther')}
            variant="outline"
            size="small"
            block={false}
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
    );

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Backdrop />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 64,
          paddingBottom: insets.bottom + space.xxl,
          paddingHorizontal: space.gutter,
          gap: space.xl,
        }}
      >
        <Animated.View
          entering={FadeIn.duration(900)}
          style={{ alignItems: 'center', gap: space.l }}
        >
          {night ? (
            <View style={{ height: 150, justifyContent: 'center' }}>
              <GlidingManta width={190} />
            </View>
          ) : (
            <View style={{ width: 200, height: 200 }}>
              <Enso size={200} />
              <Seal
                char="完"
                size={54}
                tilt={-4}
                style={{ position: 'absolute', right: -4, bottom: 8 }}
              />
            </View>
          )}
          <View style={{ alignItems: 'center' }}>
            <Text
              variant="display"
              accessibilityRole="header"
              style={
                night
                  ? { fontSize: 56, lineHeight: 60, letterSpacing: -1.5 }
                  : { fontSize: 66, lineHeight: 68 }
              }
            >
              {t('final.title')}
            </Text>
            <Text variant={night ? 'body' : 'title'} italic={!night} weight="regular" tone="soft">
              {t('final.minutes', { count: minutes })}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(700)} style={{ gap: space.xl }}>
          <View style={{ gap: space.s }}>
            <Text variant="label" tone="soft" align="center">
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
                    style={[
                      {
                        flex: 1,
                        minHeight: 84,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingHorizontal: 2,
                        overflow: 'hidden',
                      },
                      night
                        ? {
                            borderRadius: 20,
                            borderWidth: selected ? 1.5 : 1,
                            borderColor: selected ? palette.accent : palette.border,
                            backgroundColor: selected ? 'rgba(95,227,232,0.12)' : palette.surface,
                          }
                        : { borderRadius: 8 },
                      selected ? glowShadow(palette, 0.5) : null,
                    ]}
                  >
                    <SeaStateIcon state={state} />
                    <View
                      style={
                        !night && selected
                          ? {
                              borderBottomWidth: 2,
                              borderBottomColor: palette.accent,
                              paddingBottom: 2,
                            }
                          : { paddingBottom: 4 }
                      }
                    >
                      <Text
                        variant="caption"
                        weight={selected ? 'bold' : 'regular'}
                        tone={selected ? 'ink' : 'soft'}
                        align="center"
                        style={{ fontSize: 13, lineHeight: 16 }}
                        numberOfLines={2}
                      >
                        {t(`mood.${state}`)}
                      </Text>
                    </View>
                  </Press>
                );
              })}
            </View>
          </View>

          {reminder !== 'hidden' ? (
            night ? (
              <Card>
                <View style={{ flexDirection: 'row', gap: space.m }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: 'rgba(255,197,107,0.14)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="bell" size={22} color="#FFC56B" />
                  </View>
                  <View style={{ flex: 1, gap: space.m }}>{reminderBody}</View>
                </View>
              </Card>
            ) : (
              <View
                style={{
                  gap: space.m,
                  paddingVertical: space.l,
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: palette.border,
                }}
              >
                {reminderBody}
              </View>
            )
          ) : null}

          {settings.sessionsCompleted >= 2 && !premium ? (
            <Card
              onPress={() => router.push('/manta-completa')}
              accessibilityLabel={`${t('final.premiumTitle')}. ${t('final.premiumBody')}`}
            >
              <Text variant="headline">{t('final.premiumTitle')}</Text>
              <Text variant="callout" tone="soft" style={{ marginTop: 2 }}>
                {t('final.premiumBody')}
              </Text>
              <Text variant="callout" tone="accent" weight="bold" style={{ marginTop: space.s }}>
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
                overflow: 'hidden',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text variant="label" tone="accent">
                  {t('final.next')}
                </Text>
                <Text variant="headline">
                  {next.title} · {t('common.minutes', { count: Math.round(next.durationSec / 60) })}
                </Text>
              </View>
              <Icon name="chevronRight" size={18} color={palette.ink} />
            </Press>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          top: insets.top + space.s,
          left: space.l,
          right: space.l,
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
              paddingHorizontal: space.l,
              justifyContent: 'center',
              borderRadius: 22,
              borderWidth: night ? 1 : 0,
              borderColor: palette.border,
              backgroundColor: night ? palette.surface : 'transparent',
            }}
          >
            <Text variant="callout" weight="bold">
              {t('common.done')}
            </Text>
          </Press>
        ) : (
          <IconButton name="close" label={t('common.close')} onPress={close} />
        )}
      </View>
    </View>
  );
}
