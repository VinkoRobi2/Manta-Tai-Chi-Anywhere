import type { LearningPath } from '@manta/shared';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { lessonArt, programArt } from '@/features/catalog/art';
import { ArtPhoto, Scrim } from '@/features/catalog/ArtPhoto';
import type { Lesson, Program } from '@/features/catalog/catalog';
import { Squish } from '@/features/onboarding/Squish';
import { enter } from '@/features/onboarding/StepScreen';
import { appLight, fonts } from '@/theme/tokens';
import { ClockGlyph, LockGlyph, PlayGlyph, SavedGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

import type { TodayLesson } from './home';

/** Lo que la hoja blanca de abajo tapa de la foto. */
export const SHEET_OVERLAP = 28;

/**
 * La portada de Inicio: la foto de la clase que toca, de borde a borde, con el saludo arriba y,
 * abajo, el nombre de la clase, el camino del programa y el botón de sol para empezar.
 * Un toque en la foto abre la ficha de la clase. Al tirar hacia abajo, la foto se estira; al subir,
 * se queda un poco atrás (parallax).
 */
export function TodayHero({
  today,
  path,
  program,
  eyebrow,
  header,
  width,
  height,
  gutter,
  topInset,
  scrollY,
}: {
  today: TodayLesson | null;
  path: LearningPath<Lesson>;
  /** El programa en curso: su foto va de portada cuando ya no quedan clases. */
  program: Program;
  /** "Tu clase de hoy" o "Tu próxima clase". */
  eyebrow: string;
  /** El saludo y el avatar, arriba. */
  header: ReactNode;
  width: number;
  height: number;
  gutter: number;
  topInset: number;
  scrollY: SharedValue<number>;
}) {
  const { t } = useTranslation();
  const palette = appLight;
  const art = today ? lessonArt(today.lesson) : programArt(program);

  const photoStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    return y < 0
      ? { transform: [{ translateY: y / 2 }, { scale: 1 - y / height }] }
      : { transform: [{ translateY: y * 0.35 }] };
  });

  const lesson = today?.lesson;
  const locked = today?.locked ?? false;
  const minutes = lesson ? Math.round(lesson.durationSec / 60) : 0;
  const openLesson = lesson
    ? () => router.push({ pathname: '/clase/[slug]', params: { slug: lesson.slug } })
    : () => router.push('/clases');
  const startLesson = lesson
    ? () => router.push({ pathname: '/practica/[slug]', params: { slug: lesson.slug } })
    : openLesson;

  return (
    <View style={{ height, backgroundColor: '#111113' }}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width, height }, photoStyle]}>
        <ArtPhoto art={art} width={width} height={height} drift />
        <Scrim
          stops={[
            [0, 0.55],
            [0.18, 0.12],
            [0.34, 0],
            [0.5, 0.4],
            [0.7, 0.82],
            [1, 0.95],
          ]}
        />
      </Animated.View>

      {/* Toda la foto abre la ficha; detrás del contenido, para no meter un botón dentro de otro. */}
      <Pressable
        onPress={openLesson}
        accessibilityRole="button"
        accessibilityLabel={
          lesson ? `${lesson.title}, ${t('common.minutes', { count: minutes })}` : t('home.explore')
        }
        style={StyleSheet.absoluteFill}
      />

      <View
        pointerEvents="box-none"
        style={{
          flex: 1,
          paddingTop: topInset + 10,
          paddingHorizontal: gutter,
          paddingBottom: SHEET_OVERLAP + 24,
          justifyContent: 'space-between',
        }}
      >
        <View
          pointerEvents="box-none"
          style={{ width: '100%', maxWidth: 640, alignSelf: 'center' }}
        >
          {header}
        </View>

        <Animated.View
          entering={enter(1)}
          pointerEvents="box-none"
          style={{ width: '100%', maxWidth: 640, alignSelf: 'center', gap: 10 }}
        >
          <View pointerEvents="none" style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent }}
              />
              <Text
                weight="semibold"
                color={palette.onSelected}
                numberOfLines={1}
                style={{
                  flexShrink: 1,
                  fontSize: 12,
                  lineHeight: 15,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                }}
              >
                {!today
                  ? t('home.allDoneEyebrow')
                  : locked
                    ? t('home.premium')
                    : `${eyebrow} · ${t('home.lessonOf', {
                        number: today.lesson.number,
                        total: today.program.lessons.length,
                      })}`}
              </Text>
            </View>
            {today ? <PathBars path={path} /> : null}
            <Text
              accessibilityRole="header"
              color={palette.onSelected}
              maxFontSizeMultiplier={1.25}
              style={{
                fontFamily: fonts.semibold,
                fontSize: 34,
                lineHeight: 40,
                letterSpacing: -1,
              }}
            >
              {lesson ? lesson.title : t('home.allDone')}
            </Text>
            <Text
              color="rgba(255, 255, 255, 0.84)"
              numberOfLines={2}
              style={{ fontSize: 15, lineHeight: 21, maxWidth: 520 }}
            >
              {!lesson ? t('home.allDoneBody') : locked ? t('home.lockedBody') : lesson.summary}
            </Text>
          </View>

          <View
            pointerEvents="box-none"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}
          >
            {!lesson ? (
              <SunButton label={t('home.explore')} onPress={openLesson} />
            ) : locked ? (
              <SunButton
                label={t('home.seeLesson')}
                onPress={openLesson}
                icon={<LockGlyph color={palette.onAccent} size={16} strokeWidth={2.2} />}
              />
            ) : (
              <SunButton
                label={t('home.start')}
                onPress={startLesson}
                icon={<PlayGlyph color={palette.onAccent} size={16} />}
              />
            )}
            {lesson ? (
              <View pointerEvents="none" style={{ gap: 4 }}>
                <Meta icon={<ClockGlyph color={palette.onSelected} size={15} strokeWidth={2} />}>
                  {t('common.minutes', { count: minutes })}
                </Meta>
                {locked ? null : (
                  <Meta icon={<SavedGlyph color={palette.onSelected} size={15} strokeWidth={2} />}>
                    {t('home.offlineReady')}
                  </Meta>
                )}
              </View>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

/** El camino del programa: hechas en blanco, la de hoy en sol, las que faltan apagadas. */
function PathBars({ path }: { path: LearningPath<Lesson> }) {
  const palette = appLight;
  return (
    <View style={{ flexDirection: 'row', gap: 4, maxWidth: 220 }}>
      {path.steps.map((step) => (
        <View
          key={step.lesson.slug}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor:
              step.state === 'done'
                ? palette.onSelected
                : step.state === 'current'
                  ? palette.accent
                  : 'rgba(255, 255, 255, 0.28)',
          }}
        />
      ))}
    </View>
  );
}

function Meta({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {icon}
      <Text
        weight="medium"
        color="rgba(255, 255, 255, 0.9)"
        style={{ fontSize: 13, lineHeight: 17 }}
      >
        {children}
      </Text>
    </View>
  );
}

/** El botón principal: una píldora de sol con el texto en negro. */
export function SunButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
}) {
  const palette = appLight;
  return (
    <Squish
      onPress={onPress}
      accessibilityLabel={label}
      containerStyle={{ alignSelf: 'flex-start' }}
      style={{
        height: 54,
        borderRadius: 27,
        paddingLeft: icon ? 22 : 28,
        paddingRight: 28,
        backgroundColor: palette.accent,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
      }}
    >
      {icon}
      <Text weight="semibold" color={palette.onAccent} style={{ fontSize: 17, lineHeight: 22 }}>
        {label}
      </Text>
    </Squish>
  );
}
