import type { StatPeriod } from '@manta/shared';
import { router } from 'expo-router';
import { useNetworkState } from 'expo-network';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalog } from '@/features/catalog/catalog';
import { Avatar, useFirstName } from '@/features/home/Avatar';
import { greetingKey, homeModel } from '@/features/home/home';
import { PathCard } from '@/features/home/PathCard';
import { PeriodTabs } from '@/features/home/PeriodTabs';
import { ProgramChips } from '@/features/home/ProgramChips';
import { StatGrid } from '@/features/home/StatGrid';
import { TodayCard } from '@/features/home/TodayCard';
import { WeekTides } from '@/features/home/WeekTides';
import { TAB_BAR_HEIGHT } from '@/features/navigation/TabBar';
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
 * Inicio: arriba, cómo va la semana (mareas) y los números del periodo; abajo, en la franja gris,
 * los programas, la clase de hoy y el camino. Todo sale del teléfono: funciona igual sin señal.
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
  const offline = network.isConnected === false || network.isInternetReachable === false;
  const [period, setPeriod] = useState<StatPeriod>(7);

  const now = new Date();
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

  const greeting = t(`home.greeting.${greetingKey(now)}`);
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
    <View style={{ flex: 1, backgroundColor: palette.band }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 32 }}
      >
        {/* Arriba, en blanco: la semana y los números. */}
        <View
          style={{
            backgroundColor: palette.background,
            paddingTop: insets.top + 14,
            paddingHorizontal: gutter,
            paddingBottom: 22,
          }}
        >
          <View style={[column, { gap: 22 }]}>
            <Animated.View entering={enter(0)} style={{ flexDirection: 'row', gap: 14 }}>
              <Squish
                onPress={() => router.navigate('/perfil')}
                accessibilityLabel={t('tabs.profile')}
                pressedScale={0.94}
              >
                <Avatar />
              </Squish>
              <View style={{ flex: 1, gap: 2, paddingTop: 2 }}>
                <Text color={palette.muted} style={{ fontSize: 16, lineHeight: 21 }}>
                  {firstName ? t('home.greetingName', { greeting, name: firstName }) : greeting}
                </Text>
                <Text
                  accessibilityRole="header"
                  color={palette.ink}
                  maxFontSizeMultiplier={1.3}
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 24,
                    lineHeight: 30,
                    letterSpacing: -0.5,
                  }}
                >
                  {headline}
                </Text>
                {offline ? (
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}
                  >
                    <OfflineGlyph color={palette.muted} size={16} />
                    <Text color={palette.muted} style={{ fontSize: 13, lineHeight: 17 }}>
                      {t('home.offline')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Animated.View>

            <Animated.View entering={enter(1)} style={{ gap: 12 }}>
              <WeekTides week={week} size={layout.breakpoint === 'compact' ? 36 : 40} />
              {model.totalSessions === 0 ? (
                <Text color={palette.muted} style={{ fontSize: 14, lineHeight: 20 }}>
                  {t('home.tideHint', { goal: week.goal })}
                </Text>
              ) : null}
            </Animated.View>

            <Animated.View entering={enter(2)} style={{ gap: 16 }}>
              <PeriodTabs value={period} onChange={setPeriod} />
              <StatGrid comparison={model.periods[period]} showChange={model.totalSessions > 0} />
            </Animated.View>
          </View>
        </View>

        {/* Abajo, en la franja gris: programas, la clase de hoy y el camino. */}
        <Animated.View entering={enter(3)} style={{ paddingTop: 22, gap: 26 }}>
          <View style={column}>
            <ProgramChips programs={programs} gutter={gutter} />
          </View>

          <View style={[column, { paddingHorizontal: gutter, gap: 14 }]}>
            <SectionTitle>
              {model.practicedToday ? t('home.nextTitle') : t('home.todayTitle')}
            </SectionTitle>
            <TodayCard today={model.today} />
          </View>

          <View style={[column, { paddingHorizontal: gutter, gap: 14 }]}>
            <SectionTitle>{t('home.pathTitle')}</SectionTitle>
            <PathCard program={model.program} path={model.path} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      accessibilityRole="header"
      color={appLight.ink}
      style={{ fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 }}
    >
      {children}
    </Text>
  );
}
