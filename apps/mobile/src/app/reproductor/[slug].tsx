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
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
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
import { BreathGuide, StageBackground } from '@/features/player/Stage';
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
import { useTheme } from '@/theme/theme';
import { glowShadow, space, type Palette } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Icon, type IconName } from '@/ui/Icon';
import { Press } from '@/ui/Press';
import { Text } from '@/ui/Text';

/** Tamaño de los subtítulos: en Tinta van en Cormorant (más grande), en Abisal en Atkinson. */
const CAPTION_SIZE: Record<CaptionSize, { tinta: [number, number]; abisal: [number, number] }> = {
  normal: { tinta: [26, 30], abisal: [20, 28] },
  large: { tinta: [30, 34], abisal: [24, 32] },
  xlarge: { tinta: [34, 39], abisal: [28, 37] },
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
  const palette = useTheme();
  const lesson = getLesson(slug, locale);
  const timeline = lesson ? loadTimeline(lesson.slug, locale) : null;

  if (!lesson || !timeline) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.l,
        }}
      >
        <Text>{t('lesson.notFound')}</Text>
        <Button
          label={t('common.back')}
          variant="tonal"
          size="medium"
          onPress={() => router.back()}
        />
      </View>
    );
  }
  return <Player lesson={lesson} timeline={timeline} startInVoiceOnly={voz === '1'} />;
}

/** Botón del escenario: filete fino en Tinta, vidrio en Abisal. */
function StageButton({
  icon,
  label,
  onPress,
  active = false,
  highlighted = false,
  text,
  bare = false,
}: {
  icon?: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  highlighted?: boolean;
  text?: string;
  /** Sin borde ni fondo (fila secundaria de Tinta). */
  bare?: boolean;
}) {
  const palette = useTheme();
  const night = palette.name === 'abisal';
  const color = active ? palette.accent : palette.ink;
  return (
    <Press
      haptic
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[
        {
          minHeight: 48,
          minWidth: 48,
          paddingHorizontal: text ? space.m : 0,
          borderRadius: 24,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          overflow: 'hidden',
          borderWidth: highlighted ? 2 : bare ? 0 : 1,
          borderColor: highlighted ? palette.primary : palette.border,
          backgroundColor: night
            ? active
              ? 'rgba(95,227,232,0.16)'
              : bare
                ? 'transparent'
                : palette.surface
            : 'transparent',
        },
        highlighted ? glowShadow(palette, 0.6) : null,
      ]}
    >
      {icon ? <Icon name={icon} size={22} color={color} /> : null}
      {text ? (
        <Text
          variant="caption"
          weight="bold"
          color={color}
          maxFontSizeMultiplier={1.4}
          style={{ fontSize: 15 }}
        >
          {text}
        </Text>
      ) : null}
    </Press>
  );
}

function PlayButton({
  playing,
  onPress,
  size,
  palette,
  label,
}: {
  playing: boolean;
  onPress: () => void;
  size: number;
  palette: Palette;
  label: string;
}) {
  return (
    <Press
      haptic
      onPress={onPress}
      accessibilityLabel={label}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.primary,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        glowShadow(palette, 0.6),
      ]}
    >
      <Icon name={playing ? 'pause' : 'play'} size={size * 0.4} color={palette.onPrimary} />
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
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const night = palette.name === 'abisal';

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

  /** Lleva la guía de respiración al punto actual y sigue desde ahí. */
  const syncBreath = (snapshot: PlayerSnapshot, playing: boolean) => {
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
    track(completed ? 'lesson_completed' : 'lesson_abandoned', {
      lesson: lesson.slug,
      seconds,
      positionSec: Math.round(snapshot.positionMs / 1000),
    });

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
    syncBreath(player.snapshot, true);
  };

  const togglePlay = () => {
    if (playing) {
      player.pause();
      stopSpeaking();
      cancelAnimation(level);
    } else {
      player.play();
      syncBreath(snapshot, true);
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
    syncBreath({ ...player.snapshot, rate: next }, playing);
    poke();
  };

  const seek = (deltaMs: number) => {
    stopSpeaking();
    player.seekBy(deltaMs);
    poke();
  };

  useEffect(() => {
    // Al cambiar de movimiento o después de un salto, la respiración se acomoda al nuevo punto.
    if (!playing) return;
    syncBreath(snapshot, true);
    // Solo cuando cambia el segmento: no en cada tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.segmentIndex]);

  const controlsStyle = useAnimatedStyle(() => ({ opacity: controlsOpacity.value }));
  const rateLabel = `${new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 2 }).format(snapshot.rate)}×`;
  const phase = snapshot.breath?.phase;
  const breathWord = phase
    ? t(`player.${phase === 'in' ? 'inhale' : phase === 'out' ? 'exhale' : 'hold'}`)
    : '';
  const caption = tutorial ? t(`player.tutorial.${tutorial}`) : snapshot.caption;
  const [captionSize, captionLine] = CAPTION_SIZE[settings.captionSize][palette.name];
  const movementOf = t('player.movementOf', {
    index: snapshot.segmentIndex + 1,
    count: timeline.segments.length,
  });

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar hidden style={night ? 'light' : 'dark'} />
      <StageBackground />
      <Pressable style={StyleSheet.absoluteFill} onPress={poke} accessible={false} />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + space.s,
          paddingBottom: insets.bottom + space.m,
        }}
        pointerEvents="box-none"
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: space.l,
            gap: space.s,
          }}
          pointerEvents="box-none"
        >
          <StageButton icon="close" label={t('player.exit')} onPress={openExit} />
          <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityRole="header">
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              {!night && snapshot.segment.hanzi ? (
                <Text
                  color={palette.ink}
                  style={{ fontSize: 22, lineHeight: 28, fontWeight: '600', fontFamily: undefined }}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  {snapshot.segment.hanzi}
                </Text>
              ) : null}
              <Text
                variant="headline"
                numberOfLines={1}
                style={night ? { fontSize: 18, lineHeight: 24 } : { fontSize: 24, lineHeight: 28 }}
              >
                {snapshot.segment.title}
              </Text>
            </View>
            <Text variant="caption" tone="soft" numberOfLines={1}>
              {!night && snapshot.segment.pinyin
                ? `${snapshot.segment.pinyin} · ${movementOf.toLowerCase()}`
                : movementOf}
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
            gap: 6,
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
                  height: night ? 4 : 3,
                  borderRadius: 2,
                  backgroundColor: night ? 'rgba(255,255,255,0.12)' : palette.border,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={[
                    {
                      width: `${fill * 100}%`,
                      height: '100%',
                      backgroundColor: night ? palette.accent : palette.ink,
                    },
                    glowShadow(palette, 0.8),
                  ]}
                />
              </View>
            );
          })}
        </View>

        <View
          style={{ flex: 1, marginHorizontal: space.gutter, marginTop: space.m }}
          pointerEvents="none"
        >
          <InstructorStage
            lessonSlug={lesson.slug}
            segment={snapshot.segment}
            playing={playing}
            rate={snapshot.rate}
            mirrored={mirrored}
            view={view}
          />
        </View>

        <View style={{ alignItems: 'center', marginTop: space.m }} pointerEvents="none">
          <BreathGuide level={level}>
            {breathWord ? (
              <Animated.View
                key={breathWord}
                entering={FadeIn.duration(600)}
                exiting={FadeOut.duration(400)}
              >
                <Text
                  variant="title"
                  italic={!night}
                  weight="regular"
                  style={
                    night ? { fontSize: 22, lineHeight: 28 } : { fontSize: 32, lineHeight: 36 }
                  }
                >
                  {breathWord}
                </Text>
              </Animated.View>
            ) : null}
          </BreathGuide>
        </View>

        <View
          style={{
            minHeight: captionLine * 2,
            justifyContent: 'center',
            paddingHorizontal: space.xl,
            marginTop: space.s,
          }}
          pointerEvents="none"
        >
          {captionsOn && caption ? (
            <Text
              variant={night ? 'body' : 'title'}
              weight={night ? 'semibold' : 'semibold'}
              align="center"
              accessibilityLiveRegion="polite"
              style={{ fontSize: captionSize, lineHeight: captionLine }}
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
            <View
              style={
                tutorial === 'pause'
                  ? { borderRadius: 44, borderWidth: 2, borderColor: palette.ink, padding: 4 }
                  : { padding: 6 }
              }
            >
              <PlayButton
                playing={playing}
                onPress={togglePlay}
                size={74}
                palette={palette}
                label={playing ? t('player.pause') : t('player.play')}
              />
            </View>
            <StageButton
              icon="forward10"
              label={t('player.forward10')}
              onPress={() => seek(10_000)}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: night ? 'center' : 'space-between',
              gap: 4,
              marginHorizontal: space.l,
              ...(night
                ? {
                    alignSelf: 'center',
                    padding: 4,
                    borderRadius: 28,
                    backgroundColor: palette.surface,
                    borderWidth: 1,
                    borderColor: palette.border,
                  }
                : {}),
            }}
          >
            <StageButton
              bare
              icon="turtle"
              text={rateLabel}
              label={t('player.speed', { rate: rateLabel })}
              onPress={cycleRate}
              highlighted={tutorial === 'speed'}
              active={snapshot.rate < 1}
            />
            <StageButton
              bare
              icon="captions"
              text={night ? undefined : t('player.captions')}
              label={t('player.captions')}
              onPress={() => setCaptionsOn((on) => !on)}
              active={captionsOn}
              highlighted={tutorial === 'captions'}
            />
            {segmentHasVideo ? (
              <>
                <StageButton
                  bare
                  icon="mirror"
                  label={t('player.mirror')}
                  onPress={() => setMirrored((on) => !on)}
                  active={mirrored}
                />
                <StageButton
                  bare
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
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: night ? 'rgba(3,12,20,0.96)' : 'rgba(243,243,239,0.98)' },
          ]}
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
              <Text variant="title" align="center">
                {snapshot.segment.title}
              </Text>
              <BreathGuide level={level}>
                <PlayButton
                  playing={playing}
                  onPress={togglePlay}
                  size={88}
                  palette={palette}
                  label={playing ? t('player.pause') : t('player.play')}
                />
              </BreathGuide>
              <Text variant="callout" tone="soft" align="center">
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
            { backgroundColor: palette.scrim, justifyContent: 'flex-end' },
          ]}
        >
          <View
            accessibilityViewIsModal
            style={{
              backgroundColor: palette.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderWidth: night ? 1 : 0,
              borderColor: palette.border,
              padding: space.xl,
              paddingBottom: insets.bottom + space.xl,
              gap: space.m,
            }}
          >
            <Text variant="title" accessibilityRole="header">
              {t('player.exitTitle')}
            </Text>
            {player.practicedMs() >= MIN_SAVED_SECONDS * 1000 ? (
              <Text variant="callout" tone="soft">
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
