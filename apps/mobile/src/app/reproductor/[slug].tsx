import {
  PLAYBACK_RATES,
  type LessonTimeline,
  type PlayerEvent,
  type PlayerSnapshot,
} from '@manta/shared';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLesson, loadTimeline, type LessonInfo } from '@/features/catalog/catalog';
import { hasVideo, InstructorStage, type StageView } from '@/features/player/InstructorStage';
import { StageBackground, Tide } from '@/features/player/Tide';
import { usePlayer } from '@/features/player/usePlayer';
import { speak, stopSpeaking } from '@/features/player/voice';
import { recordSession } from '@/features/sessions/sessions';
import {
  getSettings,
  useSettings,
  type CaptionSize,
  type CareTag,
} from '@/features/settings/settings';
import { track } from '@/lib/analytics';
import { breathPulse } from '@/lib/haptics';
import { localeTag, useLocale } from '@/lib/i18n';
import { ThemeOverride } from '@/theme/theme';
import { cabin, space, stage } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Icon, type IconName } from '@/ui/Icon';
import { Press } from '@/ui/Press';
import { Text } from '@/ui/Text';

const CAPTION_SIZE: Record<CaptionSize, { fontSize: number; lineHeight: number }> = {
  normal: { fontSize: 22, lineHeight: 30 },
  large: { fontSize: 26, lineHeight: 34 },
  xlarge: { fontSize: 30, lineHeight: 39 },
};

/** La primera clase enseña los controles con la voz. Ese es todo el tutorial. */
type TutorialStep = 'speed' | 'captions' | 'pause';
const TUTORIAL: { key: TutorialStep; atMs: number }[] = [
  { key: 'speed', atMs: 9_000 },
  { key: 'captions', atMs: 24_000 },
  { key: 'pause', atMs: 40_000 },
];
const MIN_SAVED_SECONDS = 120;

export default function PlayerScreen() {
  const { slug, voz } = useLocalSearchParams<{ slug: string; voz?: string }>();
  const locale = useLocale();
  const { t } = useTranslation();
  const lesson = getLesson(slug, locale);
  const timeline = lesson ? loadTimeline(lesson.slug, locale) : null;

  if (!lesson || !timeline) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: stage.bottom,
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.l,
        }}
      >
        <Text tone="stage">{t('lesson.notFound')}</Text>
        <Button
          label={t('common.back')}
          variant="tonal"
          size="medium"
          onPress={() => router.back()}
        />
      </View>
    );
  }
  return (
    <ThemeOverride palette={cabin}>
      <Player lesson={lesson} timeline={timeline} startInVoiceOnly={voz === '1'} />
    </ThemeOverride>
  );
}

function StageButton({
  icon,
  label,
  onPress,
  active = false,
  highlighted = false,
  text,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  highlighted?: boolean;
  text?: string;
}) {
  const android = Platform.OS === 'android';
  return (
    <Press
      haptic
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={{
        minHeight: 48,
        minWidth: 48,
        paddingHorizontal: text ? space.m : 0,
        borderRadius: android ? 14 : 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        overflow: 'hidden',
        backgroundColor: active
          ? 'rgba(238,244,245,0.24)'
          : android
            ? stage.control
            : 'transparent',
        borderWidth: highlighted ? 2 : 0,
        borderColor: cabin.sol,
      }}
    >
      <Icon name={icon} size={22} color={stage.ink} />
      {text ? (
        <Text variant="caption" tone="stage" weight="medium" maxFontSizeMultiplier={1.4}>
          {text}
        </Text>
      ) : null}
    </Press>
  );
}

function Player({
  lesson,
  timeline,
  startInVoiceOnly,
}: {
  lesson: LessonInfo;
  timeline: LessonTimeline;
  startInVoiceOnly: boolean;
}) {
  useKeepAwake();
  const { t } = useTranslation();
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const settings = useSettings();
  const android = Platform.OS === 'android';

  const [firstClass] = useState(() => getSettings().sessionsCompleted === 0);
  const [careTags] = useState<CareTag[]>(() => getSettings().careTags);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [mirrored, setMirrored] = useState(false);
  const [view, setView] = useState<StageView>('front');
  const [voiceOnly, setVoiceOnly] = useState(startInVoiceOnly);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [interaction, setInteraction] = useState(0);
  const [tutorial, setTutorial] = useState<TutorialStep | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  const level = useSharedValue(0);
  const controlsOpacity = useSharedValue(1);
  const tutorialSeen = useRef(new Set<TutorialStep>());
  const finishRef = useRef<(completed: boolean) => void>(() => undefined);
  const finished = useRef(false);

  /** Lleva la marea al punto de la respiración actual y sigue desde ahí. */
  const syncTide = (snapshot: PlayerSnapshot, playing: boolean) => {
    cancelAnimation(level);
    const breath = snapshot.breath;
    if (!breath || breath.phase === 'hold') return;
    const target = breath.phase === 'in' ? 1 : 0;
    level.value = breath.phase === 'in' ? breath.progress : 1 - breath.progress;
    if (playing && breath.progress < 1) {
      const remaining = ((1 - breath.progress) * breath.durationMs) / snapshot.rate;
      level.value = withTiming(target, { duration: remaining, easing: Easing.inOut(Easing.sin) });
    }
  };

  const handleEvent = (event: PlayerEvent, snapshot: PlayerSnapshot) => {
    if (event.type === 'caption') {
      speak(event.text, locale, snapshot.rate);
    } else if (event.type === 'breath' && event.phase !== 'hold') {
      level.value = withTiming(event.phase === 'in' ? 1 : 0, {
        duration: event.durationMs / snapshot.rate,
        easing: Easing.inOut(Easing.sin),
      });
      if (event.phase === 'in' && settings.breathHaptics) breathPulse();
    } else if (event.type === 'ended') {
      finishRef.current(true);
    }

    if (firstClass) {
      const step = TUTORIAL.find(
        (item) => snapshot.positionMs >= item.atMs && !tutorialSeen.current.has(item.key),
      );
      if (step) {
        tutorialSeen.current.add(step.key);
        setTutorial(step.key);
        setControlsVisible(true);
        speak(t(`player.tutorial.${step.key}`), locale, 1);
        setTimeout(() => setTutorial((current) => (current === step.key ? null : current)), 8_000);
      }
    }
  };

  const player = usePlayer(timeline, handleEvent);
  const { snapshot } = player;
  const playing = snapshot.status === 'playing';
  const segmentHasVideo = hasVideo(snapshot.segment);

  const finish = (completed: boolean) => {
    if (finished.current) return;
    finished.current = true;
    stopSpeaking();
    cancelAnimation(level);
    const seconds = Math.round(player.practicedMs() / 1000);
    const props = {
      lesson: lesson.slug,
      seconds,
      positionSec: Math.round(snapshot.positionMs / 1000),
    };
    track(completed ? 'lesson_completed' : 'lesson_abandoned', props);

    if (completed || seconds >= MIN_SAVED_SECONDS) {
      const session = recordSession({
        lessonSlug: lesson.slug,
        durationSec: Math.max(seconds, 60),
        spaceMode: lesson.spaceMode,
        careTags,
      });
      router.replace({
        pathname: '/final/[slug]',
        params: { slug: lesson.slug, sesion: session.id, segundos: String(session.durationSec) },
      });
    } else {
      router.back();
    }
  };

  useEffect(() => {
    finishRef.current = finish;
  });

  const startPlayback = () => {
    const tag = careTags[0];
    if (snapshot.positionMs === 0 && tag) speak(t(`player.careNote.${tag}`), locale, 1);
    player.play();
    syncTide(player.snapshot, true);
  };

  const togglePlay = () => {
    if (playing) {
      player.pause();
      stopSpeaking();
      cancelAnimation(level);
    } else {
      player.play();
      syncTide(snapshot, true);
    }
    setInteraction(Date.now());
  };

  // Empieza solo: la persona ya tocó "Empezar". Un respiro antes para acomodarse.
  useEffect(() => {
    track('lesson_started', { lesson: lesson.slug, voiceOnly: startInVoiceOnly });
    const id = setTimeout(startPlayback, 900);
    return () => {
      clearTimeout(id);
      stopSpeaking();
    };
    // Solo al montar la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Los controles se esconden a los 4 s sin tocar la pantalla (el botón de salir no).
  useEffect(() => {
    controlsOpacity.value = withTiming(controlsVisible ? 1 : 0, { duration: 400 });
    if (!controlsVisible || !playing || confirmExit || tutorial) return;
    const id = setTimeout(() => setControlsVisible(false), 4_000);
    return () => clearTimeout(id);
  }, [controlsOpacity, controlsVisible, playing, confirmExit, tutorial, interaction]);

  const openExit = () => {
    if (playing) togglePlay();
    setConfirmExit(true);
  };

  const openExitRef = useRef(openExit);
  useEffect(() => {
    openExitRef.current = openExit;
  });
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      openExitRef.current();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const poke = () => {
    setControlsVisible(true);
    setInteraction(Date.now());
  };

  const cycleRate = () => {
    const index = PLAYBACK_RATES.indexOf(snapshot.rate as (typeof PLAYBACK_RATES)[number]);
    const next = PLAYBACK_RATES[(index - 1 + PLAYBACK_RATES.length) % PLAYBACK_RATES.length] ?? 1;
    player.setRate(next);
    syncTide({ ...player.snapshot, rate: next }, playing);
    poke();
  };

  const seek = (deltaMs: number) => {
    stopSpeaking();
    player.seekBy(deltaMs);
    poke();
  };

  useEffect(() => {
    // Después de un salto, la marea se acomoda a la respiración del nuevo punto.
    if (!playing) return;
    syncTide(snapshot, true);
    // Solo cuando cambia el segmento o se salta: no en cada tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.segmentIndex]);

  const controlsStyle = useAnimatedStyle(() => ({ opacity: controlsOpacity.value }));
  const rateLabel = `${new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 2 }).format(snapshot.rate)}×`;
  const breathWord = snapshot.breath
    ? t(
        `player.${snapshot.breath.phase === 'in' ? 'inhale' : snapshot.breath.phase === 'out' ? 'exhale' : 'hold'}`,
      )
    : '';
  const caption = tutorial ? t(`player.tutorial.${tutorial}`) : snapshot.caption;
  const captionStyle = CAPTION_SIZE[settings.captionSize];

  return (
    <View style={{ flex: 1, backgroundColor: stage.bottom }}>
      <StatusBar hidden style="light" />
      <StageBackground />
      <Tide level={level} restTop={height * 0.6} rise={height * 0.15} />
      <Pressable style={StyleSheet.absoluteFill} onPress={poke} accessible={false} />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + space.s,
          paddingBottom: insets.bottom + space.m,
        }}
        pointerEvents="box-none"
      >
        {/* Barra superior: salir siempre visible */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: space.m,
            gap: space.s,
          }}
          pointerEvents="box-none"
        >
          <StageButton icon="close" label={t('player.exit')} onPress={openExit} />
          <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityRole="header">
            <Text variant="callout" tone="stage" weight="semibold" numberOfLines={1}>
              {snapshot.segment.title}
            </Text>
            <Text variant="caption" tone="stageSoft">
              {t('player.movementOf', {
                index: snapshot.segmentIndex + 1,
                count: timeline.segments.length,
              })}
            </Text>
          </View>
          <StageButton
            icon="voice"
            label={t('player.voiceOnly')}
            onPress={() => setVoiceOnly(true)}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 4,
            paddingHorizontal: space.gutter,
            marginTop: space.m,
          }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {timeline.segments.map((segment, index) => {
            const fill =
              index < snapshot.segmentIndex
                ? 1
                : index === snapshot.segmentIndex
                  ? snapshot.segmentProgress
                  : 0;
            return (
              <View
                key={segment.startMs}
                style={{
                  flex: segment.durationMs,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: 'rgba(238,244,245,0.18)',
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: cabin.sol }}
                />
              </View>
            );
          })}
        </View>

        <View
          style={{ height: 52, alignItems: 'center', justifyContent: 'center', marginTop: space.m }}
          pointerEvents="none"
        >
          {breathWord ? (
            <Animated.View
              key={breathWord}
              entering={FadeIn.duration(600)}
              exiting={FadeOut.duration(400)}
            >
              <Text
                variant="title"
                weight="light"
                color="rgba(238,244,245,0.6)"
                style={{ fontSize: 30, letterSpacing: 1.5 }}
              >
                {breathWord}
              </Text>
            </Animated.View>
          ) : null}
        </View>

        <View style={{ flex: 1 }} pointerEvents="none">
          <InstructorStage
            lessonSlug={lesson.slug}
            segment={snapshot.segment}
            playing={playing}
            rate={snapshot.rate}
            mirrored={mirrored}
            view={view}
          />
        </View>

        <View
          style={{
            minHeight: captionStyle.lineHeight * 3,
            justifyContent: 'center',
            paddingHorizontal: space.xl,
          }}
          pointerEvents="none"
        >
          {captionsOn && caption ? (
            <Text
              tone="stage"
              align="center"
              accessibilityLiveRegion="polite"
              style={{ ...captionStyle, textShadowColor: 'rgba(6,35,43,0.8)', textShadowRadius: 8 }}
            >
              {caption}
            </Text>
          ) : null}
        </View>

        <Animated.View
          style={[{ gap: space.m, marginTop: space.m }, controlsStyle]}
          pointerEvents={controlsVisible ? 'box-none' : 'none'}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: space.xxl,
            }}
          >
            <StageButton icon="back10" label={t('player.back10')} onPress={() => seek(-10_000)} />
            <Press
              haptic
              onPress={togglePlay}
              accessibilityLabel={playing ? t('player.pause') : t('player.play')}
              style={{
                width: 76,
                height: 76,
                borderRadius: android ? 24 : 38,
                backgroundColor: cabin.sol,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderWidth: tutorial === 'pause' ? 3 : 0,
                borderColor: stage.ink,
              }}
            >
              <Icon name={playing ? 'pause' : 'play'} size={32} color="#0B3C49" />
            </Press>
            <StageButton
              icon="forward10"
              label={t('player.forward10')}
              onPress={() => seek(10_000)}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: space.s,
              marginHorizontal: space.l,
              ...(android
                ? {}
                : {
                    alignSelf: 'center',
                    padding: 4,
                    borderRadius: 28,
                    backgroundColor: 'rgba(238,244,245,0.1)',
                    borderWidth: 0.5,
                    borderColor: 'rgba(238,244,245,0.22)',
                  }),
            }}
          >
            <StageButton
              icon="turtle"
              text={rateLabel}
              label={t('player.speed', { rate: rateLabel })}
              onPress={cycleRate}
              highlighted={tutorial === 'speed'}
              active={snapshot.rate < 1}
            />
            <StageButton
              icon="captions"
              label={t('player.captions')}
              onPress={() => setCaptionsOn((on) => !on)}
              active={captionsOn}
              highlighted={tutorial === 'captions'}
            />
            {segmentHasVideo ? (
              <>
                <StageButton
                  icon="mirror"
                  label={t('player.mirror')}
                  onPress={() => setMirrored((on) => !on)}
                  active={mirrored}
                />
                <StageButton
                  icon="view"
                  text={t(`player.view.${view}`)}
                  label={t(`player.view.${view}`)}
                  onPress={() => setView((current) => (current === 'front' ? 'side' : 'front'))}
                />
              </>
            ) : null}
          </View>
        </Animated.View>
      </View>

      {voiceOnly ? (
        <Animated.View
          entering={FadeIn.duration(500)}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(3,18,22,0.94)' }]}
        >
          <View
            style={{
              flex: 1,
              paddingTop: insets.top + space.s,
              paddingBottom: insets.bottom + space.xl,
              paddingHorizontal: space.xl,
            }}
          >
            <StageButton icon="close" label={t('player.exit')} onPress={openExit} />
            <View
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl }}
            >
              <Text variant="headline" tone="stageSoft" align="center">
                {snapshot.segment.title}
              </Text>
              <Press
                haptic
                onPress={togglePlay}
                accessibilityLabel={playing ? t('player.pause') : t('player.play')}
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 66,
                  backgroundColor: 'rgba(242,177,52,0.16)',
                  borderWidth: 2,
                  borderColor: cabin.sol,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Icon name={playing ? 'pause' : 'play'} size={46} color={cabin.sol} />
              </Press>
              <Text variant="callout" tone="stageSoft" align="center">
                {t('player.voiceOnlyBody')}
              </Text>
            </View>
            <Button
              label={t('player.showClass')}
              icon="view"
              variant="quiet"
              size="medium"
              block
              onPress={() => setVoiceOnly(false)}
            />
          </View>
        </Animated.View>
      ) : null}

      {confirmExit ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
          ]}
        >
          <View
            accessibilityViewIsModal
            style={{
              backgroundColor: cabin.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: space.xl,
              paddingBottom: insets.bottom + space.xl,
              gap: space.m,
            }}
          >
            <Text variant="title" tone="stage" accessibilityRole="header">
              {t('player.exitTitle')}
            </Text>
            {player.practicedMs() >= MIN_SAVED_SECONDS * 1000 ? (
              <Text variant="callout" tone="stageSoft">
                {t('player.exitSaved')}
              </Text>
            ) : null}
            <Button
              label={t('player.exitKeep')}
              icon="play"
              onPress={() => {
                setConfirmExit(false);
                togglePlay();
              }}
            />
            <Button
              label={t('player.exitEnd')}
              variant="quiet"
              size="medium"
              block
              onPress={() => finish(false)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
