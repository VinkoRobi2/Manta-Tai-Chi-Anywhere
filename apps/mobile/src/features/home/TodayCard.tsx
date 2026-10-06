import type { SpaceMode } from '@manta/shared';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Pose } from '@/features/onboarding/PoseArt';
import { PoseThumb } from '@/features/onboarding/PoseThumb';
import { Squish } from '@/features/onboarding/Squish';
import { appLight, fonts } from '@/theme/tokens';
import { AnchorGlyph, ClockGlyph, LockGlyph, PlayGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

import type { TodayLesson } from './home';

export function poseFor(mode: SpaceMode): Pose {
  return mode === 'SEATED' ? 'seated' : 'standing';
}

/**
 * La clase que toca hoy: una tarjeta negra con el sol y la silueta, el nombre de la clase y un
 * botón de sol para empezar. Un toque en la tarjeta abre la ficha; el botón empieza de una vez.
 */
export function TodayCard({ today }: { today: TodayLesson | null }) {
  const { t } = useTranslation();
  const palette = appLight;
  const [height, setHeight] = useState(260);

  if (!today) {
    return (
      <View style={{ borderRadius: 28, backgroundColor: palette.selected, padding: 22, gap: 10 }}>
        <Text
          color={palette.onSelected}
          style={{ fontFamily: fonts.semibold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 }}
        >
          {t('home.allDone')}
        </Text>
        <Text color={palette.onSelectedMuted} style={{ fontSize: 15, lineHeight: 21 }}>
          {t('home.allDoneBody')}
        </Text>
        <SunButton label={t('home.explore')} onPress={() => router.push('/clases')} />
      </View>
    );
  }

  const { lesson, program, locked } = today;
  const minutes = Math.round(lesson.durationSec / 60);
  const openLesson = () =>
    router.push({ pathname: '/clase/[slug]', params: { slug: lesson.slug } });
  const startLesson = () =>
    router.push({ pathname: '/practica/[slug]', params: { slug: lesson.slug } });
  // La ilustración no crece con la tarjeta: si el texto ocupa más líneas, el sol se queda abajo a la derecha.
  const art = Math.min(height, 240);

  // La tarjeta abre la ficha con un área táctil detrás del contenido: así el botón de sol no queda
  // dentro de otro botón (en la web eso no es válido).
  return (
    <View
      onLayout={(event) => setHeight(Math.round(event.nativeEvent.layout.height))}
      style={{ borderRadius: 28, backgroundColor: palette.selected, overflow: 'hidden' }}
    >
      <Pressable
        onPress={openLesson}
        accessibilityRole="button"
        accessibilityLabel={`${lesson.title}, ${t('common.minutes', { count: minutes })}`}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="box-none">
        <View style={{ position: 'absolute', right: -16, bottom: 0 }}>
          <PoseThumb
            poses={[poseFor(lesson.spaceMode)]}
            width={Math.round(art * 0.8)}
            height={art}
            figureHeight={art * 0.86}
            sunSize={art * 0.58}
            sunOffsetY={-art * 0.02}
            sunColor={locked ? '#3A3A3D' : palette.accent}
            tint={palette.onSelected}
          />
        </View>
        <View pointerEvents="box-none" style={{ padding: 22, gap: 8, minHeight: 250 }}>
          {/* El texto termina antes del sol; el botón sí puede pasar por delante. */}
          <View pointerEvents="none" style={{ maxWidth: '62%', gap: 8 }}>
            <Text
              variant="label"
              color={palette.accentOnSelected}
              style={{ fontSize: 12, letterSpacing: 1.4 }}
            >
              {locked
                ? t('home.premium')
                : t('home.lessonOf', { number: lesson.number, total: program.lessons.length })}
            </Text>
            <Text
              color={palette.onSelected}
              maxFontSizeMultiplier={1.3}
              style={{
                fontFamily: fonts.semibold,
                fontSize: 26,
                lineHeight: 31,
                letterSpacing: -0.6,
              }}
            >
              {lesson.title}
            </Text>
            <Text
              color={palette.onSelectedMuted}
              numberOfLines={3}
              style={{ fontSize: 14, lineHeight: 20 }}
            >
              {locked ? t('home.lockedBody') : lesson.summary}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                columnGap: 14,
                rowGap: 4,
                marginTop: 2,
              }}
            >
              <Meta icon={<ClockGlyph color={palette.onSelectedMuted} size={15} strokeWidth={2} />}>
                {t('common.minutes', { count: minutes })}
              </Meta>
              {locked ? null : (
                <Meta
                  icon={<AnchorGlyph color={palette.onSelectedMuted} size={15} strokeWidth={2} />}
                >
                  {t('home.offlineReady')}
                </Meta>
              )}
            </View>
          </View>
          <View style={{ flex: 1, minHeight: 12 }} />
          {locked ? (
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
        </View>
      </View>
    </View>
  );
}

function Meta({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {icon}
      <Text
        weight="medium"
        color={appLight.onSelectedMuted}
        style={{ fontSize: 13, lineHeight: 17 }}
      >
        {children}
      </Text>
    </View>
  );
}

/** El botón principal de Inicio: una píldora de sol con el texto en negro. */
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
        height: 52,
        borderRadius: 26,
        paddingLeft: icon ? 20 : 26,
        paddingRight: 26,
        backgroundColor: palette.accent,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {icon}
      <Text weight="semibold" color={palette.onAccent} style={{ fontSize: 17, lineHeight: 22 }}>
        {label}
      </Text>
    </Squish>
  );
}
