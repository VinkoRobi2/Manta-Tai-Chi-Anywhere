import { LOCALES, type Locale } from '@manta/shared';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clearSession, useSession } from '@/features/auth/session';
import { Avatar, useFirstName } from '@/features/home/Avatar';
import { TAB_BAR_HEIGHT } from '@/features/navigation/TabBar';
import { restoreOnboarding } from '@/features/onboarding/onboarding';
import { useOnboardingLayout } from '@/features/onboarding/responsive';
import { Squish } from '@/features/onboarding/Squish';
import { clearPractices, usePractices } from '@/features/practice/practice';
import { clearProgress } from '@/features/progress/progress';
import { DEFAULT_SETTINGS, updateSettings, useSettings } from '@/features/settings/settings';
import { applyLanguage, LANGUAGE_NAMES, useLocale } from '@/lib/i18n';
import { appLight, fonts } from '@/theme/tokens';
import { ChevronGlyph, CloudGlyph, GlobeGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

/** Perfil: dónde se guarda el progreso, lo hecho desde el principio, las respuestas y el idioma. */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const palette = appLight;
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const settings = useSettings();
  const practices = usePractices();
  const locale = useLocale();
  const firstName = useFirstName();
  const account = session?.kind === 'account' ? session : null;
  const pending = practices.filter((practice) => !practice.synced).length;
  const minutes = Math.round(
    practices.reduce((sum, practice) => sum + practice.durationSec, 0) / 60,
  );
  const column = { width: '100%', maxWidth: 640, alignSelf: 'center' } as const;

  const chooseLanguage = (language: Locale) => {
    updateSettings({ language });
    applyLanguage(language);
  };

  // Solo en desarrollo: deja la app como recién instalada.
  const resetForTesting = () => {
    clearSession();
    clearProgress();
    clearPractices();
    updateSettings({ ...DEFAULT_SETTINGS, language: settings.language });
    restoreOnboarding();
    Alert.alert(t('profile.resetDone'));
    router.replace('/bienvenida');
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.band }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingHorizontal: layout.gutter,
          paddingBottom: TAB_BAR_HEIGHT + 32,
        }}
      >
        <View style={[column, { gap: 18 }]}>
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
            {t('profile.title')}
          </Text>

          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Avatar size={60} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text
                  weight="semibold"
                  color={palette.ink}
                  style={{ fontSize: 20, lineHeight: 25 }}
                >
                  {account
                    ? (account.user.name ?? firstName ?? account.user.email ?? '')
                    : t('profile.guest')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <CloudGlyph color={palette.muted} size={16} />
                  <Text color={palette.muted} style={{ flex: 1, fontSize: 14, lineHeight: 19 }}>
                    {account ? t('profile.cloud') : t('profile.local')}
                  </Text>
                </View>
              </View>
            </View>
            {account && pending > 0 ? (
              <Text color={palette.muted} style={{ fontSize: 14, lineHeight: 19 }}>
                {t('profile.pending', { count: pending })}
              </Text>
            ) : null}
            {account ? null : (
              <Squish
                onPress={() => router.push('/bienvenida/cuenta')}
                accessibilityLabel={t('profile.signIn')}
                style={{
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: palette.selected,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 20,
                }}
              >
                <Text
                  weight="semibold"
                  color={palette.onSelected}
                  style={{ fontSize: 16, lineHeight: 20 }}
                >
                  {t('profile.signIn')}
                </Text>
              </Squish>
            )}
          </Card>

          <Card title={t('profile.totals')}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Total label={t('profile.totalSessions')} value={practices.length} />
              <Total label={t('profile.totalMinutes')} value={minutes} />
            </View>
          </Card>

          <Card title={t('profile.practice')}>
            <Row
              label={t('profile.mode')}
              value={t(`onboarding.practice.${settings.practiceMode}`)}
            />
            <Row
              label={t('profile.minutes')}
              value={t('common.minutes', { count: settings.dailyMinutes })}
            />
            <Row
              label={t('profile.goals')}
              value={
                settings.goals.map((goal) => t(`onboarding.feel.${goal}`)).join(', ') ||
                t('profile.none')
              }
            />
            <Row
              label={t('profile.care')}
              value={
                settings.careTags.map((tag) => t(`lesson.care.${tag}`)).join(', ') ||
                t('profile.none')
              }
            />
            <Squish
              onPress={() => router.push('/bienvenida/practica')}
              accessibilityLabel={t('profile.change')}
              style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center' }}
            >
              <Text
                weight="semibold"
                color={palette.ink}
                style={{ flex: 1, fontSize: 16, lineHeight: 21 }}
              >
                {t('profile.change')}
              </Text>
              <ChevronGlyph color={palette.faint} size={20} />
            </Squish>
          </Card>

          <Card title={t('profile.language')} icon={<GlobeGlyph color={palette.ink} size={18} />}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {LOCALES.map((option) => {
                const active = option === locale;
                return (
                  <Squish
                    key={option}
                    onPress={() => chooseLanguage(option)}
                    haptic={!active}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={LANGUAGE_NAMES[option]}
                    containerStyle={{ flex: 1 }}
                    style={{
                      height: 44,
                      borderRadius: 22,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active ? palette.selected : palette.card,
                    }}
                  >
                    <Text
                      weight="medium"
                      color={active ? palette.onSelected : palette.ink}
                      style={{ fontSize: 15, lineHeight: 19 }}
                    >
                      {LANGUAGE_NAMES[option]}
                    </Text>
                  </Squish>
                );
              })}
            </View>
          </Card>

          {account ? (
            <Squish
              onPress={clearSession}
              accessibilityLabel={t('profile.signOut')}
              containerStyle={{ alignSelf: 'center' }}
              style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 }}
            >
              <Text weight="medium" color={palette.muted} style={{ fontSize: 15, lineHeight: 20 }}>
                {t('profile.signOut')}
              </Text>
            </Squish>
          ) : null}

          {__DEV__ ? (
            <Squish
              onPress={resetForTesting}
              accessibilityLabel={t('onboarding.devReset')}
              containerStyle={{ alignSelf: 'center' }}
              style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 }}
            >
              <Text weight="medium" color={palette.danger} style={{ fontSize: 15, lineHeight: 20 }}>
                {t('onboarding.devReset')}
              </Text>
            </Squish>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const palette = appLight;
  return (
    <View style={{ borderRadius: 24, backgroundColor: palette.raised, padding: 18, gap: 14 }}>
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text
            accessibilityRole="header"
            weight="semibold"
            color={palette.ink}
            style={{ fontSize: 17, lineHeight: 22 }}
          >
            {title}
          </Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const palette = appLight;
  return (
    <View
      accessible
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: palette.line,
      }}
    >
      <Text color={palette.muted} style={{ fontSize: 15, lineHeight: 21 }}>
        {label}
      </Text>
      <Text
        weight="medium"
        color={palette.ink}
        style={{ flex: 1, textAlign: 'right', fontSize: 15, lineHeight: 21 }}
      >
        {value}
      </Text>
    </View>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  const palette = appLight;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={{ flex: 1, borderRadius: 18, backgroundColor: palette.card, padding: 14, gap: 4 }}
    >
      <Text weight="medium" color={palette.muted} style={{ fontSize: 14, lineHeight: 18 }}>
        {label}
      </Text>
      <Text
        color={palette.ink}
        style={{ fontFamily: fonts.semibold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 }}
      >
        {value}
      </Text>
    </View>
  );
}
