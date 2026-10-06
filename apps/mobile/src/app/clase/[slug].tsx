import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useId, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { findLesson, lessonTimeline } from '@/features/catalog/catalog';
import { poseFor } from '@/features/home/TodayCard';
import { PoseThumb } from '@/features/onboarding/PoseThumb';
import { useOnboardingLayout } from '@/features/onboarding/responsive';
import { Squish } from '@/features/onboarding/Squish';
import { enter } from '@/features/onboarding/StepScreen';
import { svgId } from '@/features/onboarding/svgId';
import { usePractices } from '@/features/practice/practice';
import { useHasPremium } from '@/features/premium/premium';
import { useSettings } from '@/features/settings/settings';
import { useLocale } from '@/lib/i18n';
import { appLight, fonts, lessonDark } from '@/theme/tokens';
import {
  BackGlyph,
  ClockGlyph,
  LockGlyph,
  PlayGlyph,
  ProfileGlyph,
  SavedGlyph,
  SpaceGlyph,
} from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

/** La foto de cabecera de cada clase. Las clases sin foto todavía usan la silueta con el sol. */
const HERO_PHOTOS: Partial<Record<string, number>> = {
  'sentado-primeros-movimientos': require('../../../assets/images/lessons/sentado-primeros-movimientos.jpg'),
  'en-el-lugar-manos-de-nube': require('../../../assets/images/lessons/en-el-lugar-manos-de-nube.jpg'),
};

/**
 * La ficha de una clase, oscura y a pantalla completa: arriba la imagen grande con el nombre
 * encima; debajo, una lista corta con icono (duración y nivel, qué hace falta, los movimientos,
 * sin internet) y la descripción. El botón blanco para empezar flota abajo.
 */
export default function LessonScreen() {
  const { t } = useTranslation();
  const palette = lessonDark;
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const found = findLesson(locale, slug);
  const timeline = useMemo(() => (slug ? lessonTimeline(slug, locale) : null), [slug, locale]);
  const practices = usePractices();
  const settings = useSettings();
  const hasPremium = useHasPremium();
  const fadeId = svgId(useId());
  const heroHeight = Math.round(Math.min(layout.height * 0.62, 580));
  const column = { width: '100%', maxWidth: 640, alignSelf: 'center' } as const;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/inicio');
  };

  if (!found) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.ground,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 16,
        }}
      >
        <Text color={palette.ink}>{t('lessonScreen.notFound')}</Text>
        <WhiteButton label={t('lessonScreen.back')} onPress={goBack} />
      </View>
    );
  }

  const { lesson, program } = found;
  const locked = lesson.isPremium && !hasPremium;
  const timesPracticed = practices.filter((practice) => practice.lessonSlug === lesson.slug).length;
  const minutes = Math.round(lesson.durationSec / 60);
  const care = settings.careTags.map((tag) => t(`lesson.care.${tag}`).toLowerCase());
  const movements = timeline?.segments.map((segment) => segment.title).filter(Boolean) ?? [];
  const art = heroHeight * 0.9;

  return (
    <View style={{ flex: 1, backgroundColor: palette.ground }}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        <View style={{ height: heroHeight, overflow: 'hidden', backgroundColor: palette.hero }}>
          {HERO_PHOTOS[lesson.slug] ? (
            <Image
              source={HERO_PHOTOS[lesson.slug]}
              contentFit="cover"
              contentPosition="top center"
              accessibilityElementsHidden
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
          ) : (
            <View
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' }}
            >
              <PoseThumb
                poses={[poseFor(lesson.spaceMode)]}
                width={layout.width}
                height={heroHeight}
                figureHeight={art * 0.86}
                sunSize={art * 0.62}
                sunOffsetY={-heroHeight * 0.06}
                sunColor={locked ? '#3A3A3D' : appLight.accent}
                tint={palette.silhouette}
              />
            </View>
          )}
          {/* La imagen se funde con el fondo para que el título se lea encima. */}
          <Svg
            width="100%"
            height={heroHeight * 0.55 + 2}
            style={{ position: 'absolute', left: 0, right: 0, bottom: -1 }}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <Defs>
              <LinearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={palette.ground} stopOpacity={0} />
                <Stop offset="0.7" stopColor={palette.ground} stopOpacity={0.85} />
                <Stop offset="1" stopColor={palette.ground} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${fadeId})`} />
          </Svg>
          <View
            style={[
              column,
              {
                flex: 1,
                paddingTop: insets.top + 4,
                paddingHorizontal: layout.gutter,
                paddingBottom: 6,
                justifyContent: 'space-between',
              },
            ]}
          >
            <Squish
              onPress={goBack}
              accessibilityLabel={t('lessonScreen.back')}
              containerStyle={{ alignSelf: 'flex-start', marginLeft: -10 }}
              style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
            >
              <BackGlyph color={palette.ink} size={28} strokeWidth={2} />
            </Squish>
            <Animated.View entering={enter(0)} style={{ gap: 8 }}>
              <Text
                accessibilityRole="header"
                color={palette.ink}
                maxFontSizeMultiplier={1.3}
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 32,
                  lineHeight: 38,
                  letterSpacing: -0.6,
                }}
              >
                {lesson.title}
              </Text>
              <Text color={palette.muted} style={{ fontSize: 17, lineHeight: 22 }}>
                {t('lessonScreen.overline', { number: lesson.number, program: program.title })}
              </Text>
            </Animated.View>
          </View>
        </View>

        <View style={[column, { paddingHorizontal: layout.gutter, paddingTop: 22, gap: 26 }]}>
          <Animated.View entering={enter(1)} style={{ gap: 18 }}>
            <InfoRow icon={<ClockGlyph color={palette.ink} size={24} strokeWidth={2} />}>
              {`${t('common.minutes', { count: minutes })}, ${t(`level.${program.level}`)}`}
            </InfoRow>
            <InfoRow icon={<SpaceGlyph mode={lesson.spaceMode} color={palette.ink} size={24} />}>
              {t(`lessonScreen.needs.${lesson.spaceMode}`)}
            </InfoRow>
            {movements.length > 0 ? (
              <InfoRow icon={<ProfileGlyph color={palette.ink} size={24} strokeWidth={2} />}>
                {movements.join(', ')}
              </InfoRow>
            ) : null}
            <InfoRow icon={<SavedGlyph color={palette.ink} size={24} strokeWidth={2} />}>
              {t('lessonScreen.offline')}
            </InfoRow>
          </Animated.View>

          <Animated.View entering={enter(2)} style={{ gap: 12 }}>
            <Text color={palette.muted} style={{ fontSize: 18, lineHeight: 28 }}>
              {lesson.summary}
            </Text>
            {care.length > 0 ? (
              <Text color={palette.muted} style={{ fontSize: 16, lineHeight: 24 }}>
                {t('lessonScreen.care', { zones: care.join(', ') })}
              </Text>
            ) : null}
            {timesPracticed > 0 ? (
              <Text color={palette.faint} style={{ fontSize: 15, lineHeight: 21 }}>
                {t('lessonScreen.practiced', { count: timesPracticed })}
              </Text>
            ) : null}
          </Animated.View>
        </View>
      </ScrollView>

      {/* El botón flota abajo, sobre el fondo casi opaco para que el texto de atrás no moleste. */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: layout.gutter,
          paddingTop: 14,
          paddingBottom: insets.bottom + 12,
          backgroundColor: palette.scrim,
        }}
      >
        <View style={[column, { gap: 6 }]}>
          {locked ? (
            <>
              <WhiteButton
                label={t('lessonScreen.locked')}
                disabled
                icon={<LockGlyph color={palette.faint} size={18} strokeWidth={2.2} />}
              />
              <Text align="center" color={palette.muted} style={{ fontSize: 14, lineHeight: 19 }}>
                {t('lessonScreen.lockedBody')}
              </Text>
            </>
          ) : (
            <WhiteButton
              label={timesPracticed > 0 ? t('lessonScreen.again') : t('lessonScreen.start')}
              onPress={() =>
                router.push({ pathname: '/practica/[slug]', params: { slug: lesson.slug } })
              }
              icon={<PlayGlyph color={appLight.ink} size={18} />}
            />
          )}
        </View>
      </View>
    </View>
  );
}

function InfoRow({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <View accessible style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
      <View style={{ width: 28, alignItems: 'center', paddingTop: 1 }}>{icon}</View>
      <Text color={lessonDark.ink} style={{ flex: 1, fontSize: 18, lineHeight: 26 }}>
        {children}
      </Text>
    </View>
  );
}

/** La píldora blanca de la ficha: el botón más visible de la pantalla. */
function WhiteButton({
  label,
  onPress,
  icon,
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  const palette = lessonDark;
  return (
    <Squish
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      pressedScale={0.98}
      style={{
        height: 60,
        borderRadius: 30,
        backgroundColor: disabled ? palette.card : palette.ink,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 24,
      }}
    >
      {icon}
      <Text
        weight="semibold"
        color={disabled ? palette.faint : appLight.ink}
        style={{ fontSize: 18, lineHeight: 23 }}
      >
        {label}
      </Text>
    </Squish>
  );
}
