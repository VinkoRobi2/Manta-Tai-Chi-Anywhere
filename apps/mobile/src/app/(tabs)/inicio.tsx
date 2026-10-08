import { STAT_PERIODS, type StatPeriod } from '@manta/shared';
import { router, useIsFocused } from 'expo-router';
import { useNetworkState } from 'expo-network';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { catalog } from '@/features/catalog/catalog';
import { Avatar, useFirstName } from '@/features/home/Avatar';
import { greetingKey, homeModel } from '@/features/home/home';
import { ProgramCards } from '@/features/home/ProgramCards';
import { Segmented } from '@/features/home/Segmented';
import { StatGrid } from '@/features/home/StatGrid';
import { SHEET_OVERLAP, TodayHero } from '@/features/home/TodayHero';
import { WeekDays } from '@/features/home/WeekDays';
import { TAB_BAR_HEIGHT } from '@/features/navigation/TabBar';
import { TextButton } from '@/features/onboarding/ContinueButton';
import { Ring } from '@/features/onboarding/PoseArt';
import { useOnboardingLayout } from '@/features/onboarding/responsive';
import { Squish } from '@/features/onboarding/Squish';
import { enter } from '@/features/onboarding/StepScreen';
import { toEntries, usePractices } from '@/features/practice/practice';
import { useHasPremium } from '@/features/premium/premium';
import { useSettings } from '@/features/settings/settings';
import { useLocale } from '@/lib/i18n';
import { appLight, fonts } from '@/theme/tokens';
import { OfflineGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

/**
 * Inicio. Arriba, de borde a borde, la foto de la clase que toca con el saludo y el botón para
 * empezar. Debajo, en una hoja blanca: la semana, los números del periodo y los programas.
 * Todo sale del teléfono: funciona igual sin señal.
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const palette = appLight;
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const settings = useSettings();
  const practices = usePractices();
  const hasPremium = useHasPremium();
  const firstName = useFirstName();
  const network = useNetworkState();
  const focused = useIsFocused();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  const [period, setPeriod] = useState<StatPeriod>(7);

  const model = useMemo(
    () =>
      homeModel(toEntries(practices), {
        locale,
        mode: settings.practiceMode,
        hasPremium,
        now: new Date(),
      }),
    [practices, locale, settings.practiceMode, hasPremium],
  );
  const programs = useMemo(() => catalog(locale), [locale]);
  const practiced = useMemo(
    () => new Set(practices.map((practice) => practice.lessonSlug)),
    [practices],
  );

  // La foto ocupa algo más de la mitad de la pantalla; la hoja blanca asoma debajo.
  const heroHeight = Math.round(Math.min(Math.max(layout.height * 0.64, 480), 680));
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  // La barra de estado va en blanco sobre la foto y en negro cuando sube la hoja blanca.
  const [overPhoto, setOverPhoto] = useState(true);
  const threshold = heroHeight - SHEET_OVERLAP - insets.top;
  useAnimatedReaction(
    () => scrollY.value < threshold,
    (now, before) => {
      if (now !== before) scheduleOnRN(setOverPhoto, now);
    },
    [threshold],
  );

  const greeting = t(`home.greeting.${greetingKey(new Date())}`);
  const { week } = model;
  const headline =
    model.totalSessions === 0
      ? t('home.headline.first')
      : week.reached
        ? t('home.headline.reached', { count: week.count })
        : t('home.headline.progress', { count: week.count, goal: week.goal });
  const gutter = layout.gutter;
  const column = { width: '100%', maxWidth: 640, alignSelf: 'center' } as const;

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      {/* Solo la pestaña a la vista manda en la barra de estado. */}
      {focused ? <StatusBar style={overPhoto ? 'light' : 'dark'} animated /> : null}
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 28 }}
      >
        <TodayHero
          today={model.today}
          path={model.path}
          program={model.program}
          eyebrow={model.practicedToday ? t('home.nextTitle') : t('home.todayTitle')}
          width={layout.width}
          height={heroHeight}
          gutter={gutter}
          topInset={insets.top}
          scrollY={scrollY}
          header={
            <Animated.View
              entering={enter(0)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  color={palette.onSelected}
                  maxFontSizeMultiplier={1.3}
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 22,
                    lineHeight: 28,
                    letterSpacing: -0.4,
                  }}
                >
                  {firstName ? t('home.greetingName', { greeting, name: firstName }) : greeting}
                </Text>
                {offline ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <OfflineGlyph color="rgba(255, 255, 255, 0.85)" size={15} />
                    <Text
                      color="rgba(255, 255, 255, 0.85)"
                      style={{ fontSize: 13, lineHeight: 17 }}
                    >
                      {t('home.offline')}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Squish
                onPress={() => router.navigate('/perfil')}
                accessibilityLabel={t('tabs.profile')}
                pressedScale={0.94}
                style={{
                  borderRadius: 24,
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.55)',
                }}
              >
                <Avatar size={42} />
              </Squish>
            </Animated.View>
          }
        />

        {/* La hoja blanca sube sobre la foto, con las esquinas redondas. */}
        <View
          style={{
            marginTop: -SHEET_OVERLAP,
            borderTopLeftRadius: SHEET_OVERLAP,
            borderTopRightRadius: SHEET_OVERLAP,
            backgroundColor: palette.background,
            paddingTop: 26,
            gap: 34,
          }}
        >
          <Animated.View
            entering={enter(2)}
            style={[column, { paddingHorizontal: gutter, gap: 18 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <SectionTitle>{t('home.weekTitle')}</SectionTitle>
                <Text color={palette.muted} style={{ fontSize: 15, lineHeight: 21 }}>
                  {headline}
                </Text>
              </View>
              <GoalRing count={week.count} goal={week.goal} />
            </View>
            <WeekDays week={week} size={layout.breakpoint === 'compact' ? 34 : 38} />
            {model.totalSessions === 0 ? (
              <Text color={palette.muted} style={{ fontSize: 14, lineHeight: 20 }}>
                {t('home.weekHint', { goal: week.goal })}
              </Text>
            ) : null}
          </Animated.View>

          <Animated.View
            entering={enter(3)}
            style={[column, { paddingHorizontal: gutter, gap: 14 }]}
          >
            <SectionTitle>{t('home.progressTitle')}</SectionTitle>
            <Segmented
              segments={STAT_PERIODS.map((days) => ({
                value: days,
                label: t('home.period', { count: days }),
              }))}
              value={period}
              onChange={setPeriod}
              height={42}
            />
            <StatGrid comparison={model.periods[period]} showChange={model.totalSessions > 0} />
          </Animated.View>

          <Animated.View entering={enter(4)} style={[column, { gap: 14 }]}>
            <View
              style={{
                paddingHorizontal: gutter,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <SectionTitle>{t('home.programsTitle')}</SectionTitle>
              <TextButton
                label={t('home.seeAll')}
                color={palette.muted}
                onPress={() => router.navigate('/clases')}
              />
            </View>
            <ProgramCards
              programs={programs}
              practiced={practiced}
              gutter={gutter}
              width={Math.min(layout.width, 640)}
            />
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      accessibilityRole="header"
      color={appLight.ink}
      style={{ fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.5 }}
    >
      {children}
    </Text>
  );
}

/** La meta de la semana: un aro de sol que se llena con los días practicados. */
function GoalRing({ count, goal }: { count: number; goal: number }) {
  const palette = appLight;
  const size = 62;
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={{ position: 'absolute' }}>
        <Ring
          size={size}
          stroke={6}
          progress={Math.min(1, count / goal)}
          track={palette.card}
          color={palette.accent}
        />
      </View>
      <Text
        color={palette.ink}
        style={{ fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20, letterSpacing: -0.2 }}
      >
        {`${count}/${goal}`}
      </Text>
    </View>
  );
}
