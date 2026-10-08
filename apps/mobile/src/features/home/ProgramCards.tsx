import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { programArt } from '@/features/catalog/art';
import { ArtPhoto, Scrim } from '@/features/catalog/ArtPhoto';
import type { Program } from '@/features/catalog/catalog';
import { Squish } from '@/features/onboarding/Squish';
import { appLight, fonts } from '@/theme/tokens';
import { LockGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

/** Lo que va hecho de un programa: clases practicadas al menos una vez. */
export function programDone(program: Program, practiced: ReadonlySet<string>): number {
  return program.lessons.filter((lesson) => practiced.has(lesson.slug)).length;
}

/**
 * Los programas como portadas: la foto del programa, su nombre encima y una barra de sol con lo
 * que va hecho. Se deslizan de lado y se detienen en cada tarjeta. Un toque abre Clases en ese
 * programa.
 */
export function ProgramCards({
  programs,
  practiced,
  gutter,
  width,
}: {
  programs: readonly Program[];
  practiced: ReadonlySet<string>;
  gutter: number;
  /** Ancho de la pantalla (o de la columna), para medir las tarjetas. */
  width: number;
}) {
  const { t } = useTranslation();
  const cardWidth = Math.round(Math.min(300, width * 0.74));
  const cardHeight = Math.round(cardWidth * 0.72);
  const gap = 12;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={cardWidth + gap}
      snapToAlignment="start"
      contentContainerStyle={{ paddingHorizontal: gutter, gap }}
    >
      {programs.map((program) => {
        const done = programDone(program, practiced);
        const total = program.lessons.length;
        return (
          <Squish
            key={program.slug}
            onPress={() => router.push({ pathname: '/clases', params: { programa: program.slug } })}
            pressedScale={0.97}
            accessibilityLabel={[
              program.title,
              t('classes.count', { count: total }),
              program.isPremium ? t('classes.premium') : null,
              done > 0 ? t('home.programDone', { done, total }) : null,
            ]
              .filter(Boolean)
              .join(', ')}
          >
            <ProgramCover
              program={program}
              done={done}
              width={cardWidth}
              height={cardHeight}
              radius={24}
            />
          </Squish>
        );
      })}
    </ScrollView>
  );
}

/** La portada de un programa: foto, insignia (Gratis o Premium), nombre y progreso. */
export function ProgramCover({
  program,
  done,
  width,
  height,
  radius,
  drift = false,
  large = false,
}: {
  program: Program;
  done: number;
  width: number;
  height: number;
  radius: number;
  drift?: boolean;
  /** La portada grande de Clases: nombre más grande y la descripción. */
  large?: boolean;
}) {
  const { t } = useTranslation();
  const palette = appLight;
  const total = program.lessons.length;
  const minutes = Math.round(
    program.lessons.reduce((sum, lesson) => sum + lesson.durationSec, 0) / 60,
  );

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: '#1C1C1F',
      }}
    >
      <ArtPhoto art={programArt(program)} width={width} height={height} drift={drift} />
      <Scrim
        stops={[
          [0, 0.3],
          [0.22, 0],
          [0.4, 0.14],
          [0.62, 0.62],
          [1, 0.92],
        ]}
      />
      <View
        style={{
          position: 'absolute',
          top: large ? 18 : 14,
          left: large ? 18 : 14,
          right: large ? 18 : 14,
          flexDirection: 'row',
        }}
      >
        <Badge premium={program.isPremium} />
      </View>
      <View
        style={{
          position: 'absolute',
          left: large ? 20 : 16,
          right: large ? 20 : 16,
          bottom: large ? 20 : 16,
          gap: large ? 8 : 6,
        }}
      >
        <Text
          weight="semibold"
          color="rgba(255, 255, 255, 0.78)"
          style={{ fontSize: 12, lineHeight: 15, letterSpacing: 1.2, textTransform: 'uppercase' }}
        >
          {[
            t(`level.${program.level}`),
            t('classes.count', { count: total }),
            large ? t('common.minutes', { count: minutes }) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <Text
          color={palette.onSelected}
          numberOfLines={2}
          maxFontSizeMultiplier={1.25}
          style={{
            fontFamily: fonts.semibold,
            fontSize: large ? 30 : 22,
            lineHeight: large ? 35 : 27,
            letterSpacing: large ? -0.8 : -0.4,
          }}
        >
          {program.title}
        </Text>
        {large ? (
          <Text
            color="rgba(255, 255, 255, 0.82)"
            numberOfLines={2}
            style={{ fontSize: 15, lineHeight: 21 }}
          >
            {program.description}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${(done / total) * 100}%`,
                height: 4,
                borderRadius: 2,
                backgroundColor: palette.accent,
              }}
            />
          </View>
          <Text
            weight="semibold"
            color={palette.onSelected}
            style={{ fontSize: 13, lineHeight: 17, fontVariant: ['tabular-nums'] }}
          >
            {`${done}/${total}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** "Gratis" en vidrio blanco; "Premium" en sol, con candado. */
function Badge({ premium }: { premium: boolean }) {
  const { t } = useTranslation();
  const palette = appLight;
  return (
    <View
      style={{
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: premium ? palette.accent : 'rgba(255, 255, 255, 0.2)',
        borderWidth: premium ? 0 : 1,
        borderColor: 'rgba(255, 255, 255, 0.28)',
      }}
    >
      {premium ? <LockGlyph color={palette.onAccent} size={13} strokeWidth={2.2} /> : null}
      <Text
        weight="semibold"
        color={premium ? palette.onAccent : palette.onSelected}
        style={{ fontSize: 12, lineHeight: 15 }}
      >
        {premium ? t('classes.premium') : t('classes.free')}
      </Text>
    </View>
  );
}
