import {
  createTimelinePlayer,
  DEFAULT_WEEKLY_GOAL,
  formatClock,
  SEA_STATES,
  tideWeek,
  type LessonTimeline,
  type PlayerSnapshot,
  type SeaState,
} from '@manta/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { findLesson, lessonTimeline } from '@/features/catalog/catalog';
import { homeModel } from '@/features/home/home';
import { WeekTides } from '@/features/home/WeekTides';
import { CheckBadge } from '@/features/onboarding/ChoiceCard';
import { ContinueButton } from '@/features/onboarding/ContinueButton';
import { useOnboardingLayout } from '@/features/onboarding/responsive';
import { Squish } from '@/features/onboarding/Squish';
import { enter } from '@/features/onboarding/StepScreen';
import { recordPractice, toEntries, usePractices } from '@/features/practice/practice';
import { useHasPremium } from '@/features/premium/premium';
import { useSettings } from '@/features/settings/settings';
import { successFeedback } from '@/lib/haptics';
import { useLocale } from '@/lib/i18n';
import { appLight, fonts, practiceDark } from '@/theme/tokens';
import { CloseGlyph, PauseGlyph, PlayGlyph, SeaGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

/** Menos de un minuto no cuenta como práctica: se sale sin guardar. */
const MIN_PRACTICE_MS = 60_000;
const TICK_MS = 200;
const ORB_MIN = 0.58;

type Stage = 'practice' | 'mood' | 'done';

/**
 * La práctica guiada: el movimiento, una esfera de sol que crece al inhalar y se encoge al exhalar,
 * y las indicaciones del guion. Al terminar pregunta cómo está "tu mar" y guarda la práctica en el
 * teléfono (y en la nube si hay cuenta y señal).
 */
export default function PracticeScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const found = findLesson(locale, slug);
  const timeline = useMemo(() => (slug ? lessonTimeline(slug, locale) : null), [slug, locale]);
  const [stage, setStage] = useState<Stage>('practice');
  const [elapsedMs, setElapsedMs] = useState(0);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/inicio');
  };

  if (!found || !timeline) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: practiceDark.ground,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 16,
        }}
      >
        <Text color={practiceDark.ink}>{t('lessonScreen.notFound')}</Text>
        <ContinueButton label={t('lessonScreen.back')} onPress={leave} />
      </View>
    );
  }

  const save = (mood: SeaState | null) => {
    recordPractice({
      lessonSlug: found.lesson.slug,
      durationSec: elapsedMs / 1000,
      mood,
      spaceMode: found.lesson.spaceMode,
    });
    successFeedback();
    setStage('done');
  };

  if (stage === 'mood') return <MoodStage onChoose={save} />;
  if (stage === 'done') {
    return (
      <DoneStage title={found.lesson.title} minutes={Math.max(1, Math.round(elapsedMs / 60_000))} />
    );
  }
  return (
    <GuidedStage
      timeline={timeline}
      onFinish={(positionMs) => {
        setElapsedMs(positionMs);
        if (positionMs < MIN_PRACTICE_MS) leave();
        else setStage('mood');
      }}
    />
  );
}

function GuidedStage({
  timeline,
  onFinish,
}: {
  timeline: LessonTimeline;
  onFinish: (positionMs: number) => void;
}) {
  const { t } = useTranslation();
  const palette = practiceDark;
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  // Un reproductor por práctica: se crea una sola vez.
  const [player] = useState(() => createTimelinePlayer(timeline));
  const [snapshot, setSnapshot] = useState<PlayerSnapshot>(() => player.snapshot(Date.now()));
  const [paused, setPaused] = useState(false);
  const scale = useSharedValue(ORB_MIN);
  const orb = Math.min(layout.width - 80, layout.height * 0.36, 300);

  const breathe = (phase: 'in' | 'out' | 'hold', durationMs: number) => {
    if (phase === 'hold') return;
    const target = phase === 'in' ? 1 : ORB_MIN;
    scale.value = reducedMotion
      ? target
      : withTiming(target, { duration: durationMs, easing: Easing.inOut(Easing.sin) });
  };

  useEffect(() => {
    player.play(Date.now());
    const id = setInterval(() => {
      const { snapshot: next, events } = player.tick(Date.now());
      setSnapshot(next);
      for (const event of events) {
        if (event.type === 'breath') breathe(event.phase, event.durationMs);
        if (event.type === 'ended') onFinish(next.positionMs);
      }
    }, TICK_MS);
    return () => clearInterval(id);
    // El reloj se arma una sola vez por práctica.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  const togglePause = () => {
    const now = Date.now();
    if (paused) {
      player.play(now);
      // La respiración sigue desde donde quedó.
      const breath = player.snapshot(now).breath;
      if (breath) breathe(breath.phase, breath.durationMs * (1 - breath.progress));
    } else {
      player.pause(now);
      cancelAnimation(scale);
    }
    setPaused(!paused);
    setSnapshot(player.snapshot(now));
  };

  const finish = () => {
    const now = Date.now();
    player.pause(now);
    onFinish(player.snapshot(now).positionMs);
  };

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const remaining = timeline.totalDurationMs - snapshot.positionMs;
  const breathLabel = snapshot.breath ? t(`practice.breath.${snapshot.breath.phase}`) : '';

  return (
    <View style={{ flex: 1, backgroundColor: palette.ground }}>
      <StatusBar style="light" />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 8,
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Squish
            onPress={finish}
            accessibilityLabel={t('practice.close')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: palette.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseGlyph color={palette.ink} size={22} strokeWidth={2.2} />
          </Squish>
          <Text
            align="center"
            weight="medium"
            color={palette.inkSoft}
            style={{ flex: 1, fontSize: 14, lineHeight: 18 }}
          >
            {t('practice.movement', {
              current: snapshot.segmentIndex + 1,
              total: timeline.segments.length,
            })}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={{ flexDirection: 'row', gap: 4, marginTop: 14 }}>
          {timeline.segments.map((segment, index) => {
            const fill =
              index < snapshot.segmentIndex
                ? 1
                : index === snapshot.segmentIndex
                  ? snapshot.segmentProgress
                  : 0;
            return (
              <View
                key={`${segment.clip}-${index}`}
                style={{
                  flex: segment.durationMs,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: palette.track,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: palette.sol }}
                />
              </View>
            );
          })}
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <Animated.View key={snapshot.segmentIndex} entering={FadeIn.duration(600)}>
            <Text
              align="center"
              accessibilityRole="header"
              color={palette.ink}
              style={{
                fontFamily: fonts.semibold,
                fontSize: 28,
                lineHeight: 34,
                letterSpacing: -0.5,
              }}
            >
              {snapshot.segment.title}
            </Text>
          </Animated.View>

          <View
            style={{ width: orb, height: orb, alignItems: 'center', justifyContent: 'center' }}
            accessible
            accessibilityLabel={breathLabel}
          >
            <View
              style={{
                position: 'absolute',
                width: orb,
                height: orb,
                borderRadius: orb / 2,
                borderWidth: 1.5,
                borderColor: palette.track,
              }}
            />
            <Animated.View
              style={[
                { width: orb, height: orb, borderRadius: orb / 2, backgroundColor: palette.sol },
                orbStyle,
              ]}
            />
            <Text
              weight="semibold"
              color={palette.onSol}
              style={{ position: 'absolute', fontSize: 22, lineHeight: 28 }}
            >
              {breathLabel}
            </Text>
          </View>

          <Animated.View
            key={snapshot.caption ?? ''}
            entering={FadeIn.duration(500)}
            style={{ minHeight: 84, maxWidth: 440 }}
          >
            <Text align="center" color={palette.inkSoft} style={{ fontSize: 19, lineHeight: 28 }}>
              {snapshot.caption ?? ''}
            </Text>
          </Animated.View>
        </View>

        <View style={{ alignItems: 'center', gap: 14 }}>
          <Text weight="medium" color={palette.inkSoft} style={{ fontSize: 15, lineHeight: 20 }}>
            {t('practice.remaining', { time: formatClock(remaining) })}
          </Text>
          <Squish
            onPress={togglePause}
            accessibilityLabel={paused ? t('practice.resume') : t('practice.pause')}
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: palette.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {paused ? (
              <PlayGlyph color={palette.ground} size={30} />
            ) : (
              <PauseGlyph color={palette.ground} size={28} />
            )}
          </Squish>
        </View>
      </View>
    </View>
  );
}

function MoodStage({ onChoose }: { onChoose: (mood: SeaState | null) => void }) {
  const { t } = useTranslation();
  const palette = practiceDark;
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: palette.ground }}>
      <StatusBar style="light" />
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
          justifyContent: 'center',
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: layout.gutter,
          gap: 24,
        }}
      >
        <Animated.View entering={enter(0)} style={{ gap: 8 }}>
          <Text
            accessibilityRole="header"
            color={palette.ink}
            style={{
              fontFamily: fonts.semibold,
              fontSize: 30,
              lineHeight: 36,
              letterSpacing: -0.6,
            }}
          >
            {t('practice.mood.title')}
          </Text>
          <Text color={palette.inkSoft} style={{ fontSize: 16, lineHeight: 23 }}>
            {t('practice.mood.body')}
          </Text>
        </Animated.View>
        <Animated.View
          entering={enter(1)}
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}
        >
          {SEA_STATES.map((state) => (
            <Squish
              key={state}
              onPress={() => onChoose(state)}
              accessibilityLabel={t(`practice.mood.${state}`)}
              containerStyle={{ flexBasis: '46%', flexGrow: 1 }}
              style={{
                height: 120,
                borderRadius: 24,
                backgroundColor: palette.card,
                padding: 16,
                justifyContent: 'space-between',
              }}
            >
              <SeaGlyph
                state={state}
                color={state === 'CALM' ? palette.sol : palette.ink}
                size={34}
                strokeWidth={2}
              />
              <Text weight="semibold" color={palette.ink} style={{ fontSize: 18, lineHeight: 23 }}>
                {t(`practice.mood.${state}`)}
              </Text>
            </Squish>
          ))}
        </Animated.View>
        <Squish
          onPress={() => onChoose(null)}
          haptic={false}
          accessibilityLabel={t('practice.mood.skip')}
          containerStyle={{ alignSelf: 'center' }}
          style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 }}
        >
          <Text weight="medium" color={palette.inkSoft} style={{ fontSize: 15, lineHeight: 20 }}>
            {t('practice.mood.skip')}
          </Text>
        </Squish>
      </View>
    </View>
  );
}

function DoneStage({ title, minutes }: { title: string; minutes: number }) {
  const { t } = useTranslation();
  const palette = appLight;
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const practices = usePractices();
  const settings = useSettings();
  const hasPremium = useHasPremium();
  const entries = toEntries(practices);
  const now = new Date();
  const week = tideWeek(entries, now, DEFAULT_WEEKLY_GOAL);
  const next = homeModel(entries, { locale, mode: settings.practiceMode, hasPremium, now }).today;

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: insets.top + 24,
          paddingHorizontal: layout.gutter,
          paddingBottom: 24,
        }}
      >
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: 26 }}>
          <Animated.View entering={enter(0)} style={{ gap: 14 }}>
            <CheckBadge size={44} />
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
              {t('practice.done.title')}
            </Text>
            <Text color={palette.muted} style={{ fontSize: 17, lineHeight: 24 }}>
              {t('practice.done.summary', { title, minutes })}
            </Text>
          </Animated.View>
          <Animated.View
            entering={enter(1)}
            style={{ borderRadius: 24, backgroundColor: palette.card, padding: 18, gap: 16 }}
          >
            <Text weight="semibold" color={palette.ink} style={{ fontSize: 17, lineHeight: 23 }}>
              {week.reached
                ? t('practice.done.reached')
                : t('practice.done.tides', { count: week.count, goal: week.goal })}
            </Text>
            <WeekTides week={week} size={36} empty={palette.raised} />
          </Animated.View>
          {next && !next.locked ? (
            <Animated.View entering={enter(2)}>
              <Text color={palette.muted} style={{ fontSize: 16, lineHeight: 22 }}>
                {t('practice.done.next', { title: next.lesson.title })}
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </ScrollView>
      <View
        style={{
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + 12,
          width: '100%',
          maxWidth: 560 + layout.gutter * 2,
          alignSelf: 'center',
        }}
      >
        <ContinueButton
          label={t('practice.done.home')}
          onPress={() => router.dismissTo('/inicio')}
        />
      </View>
    </View>
  );
}
