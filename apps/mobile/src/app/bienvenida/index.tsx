import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clearSession, getSession } from '@/features/auth/session';
import { ContinueButton, TextButton } from '@/features/onboarding/ContinueButton';
import { GlobeGlyph, OfflineIcon, PracticeIcon } from '@/features/onboarding/OptionIcons';
import {
  hasOnboardingProgress,
  restoreOnboarding,
  resumeHref,
  startOnboarding,
} from '@/features/onboarding/onboarding';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { Float, RevealText } from '@/features/onboarding/motion';
import { Squish } from '@/features/onboarding/Squish';
import { enter } from '@/features/onboarding/StepScreen';
import { WelcomeBackdrop } from '@/features/onboarding/WelcomeBackdrop';
import { clearPractices } from '@/features/practice/practice';
import { clearProgress } from '@/features/progress/progress';
import { DEFAULT_SETTINGS, getSettings, updateSettings } from '@/features/settings/settings';
import { LANGUAGE_NAMES, useLocale } from '@/lib/i18n';
import { fonts, welcome } from '@/theme/tokens';
import { MantaMark } from '@/ui/Brand';
import { ClockGlyph } from '@/ui/Glyphs';
import { Text } from '@/ui/Text';

const SHEET_RADIUS = 32;

/**
 * Bienvenida: arriba, fotos de tai chi que se acercan despacio y se funden; abajo una hoja blanca
 * con la marca, la promesa (palabra por palabra) y un solo botón. En pantallas anchas, imagen a la izquierda.
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const tablet = layout.breakpoint === 'tablet';
  const compact = layout.breakpoint === 'compact';
  const wide = layout.wide;
  const imageWidth = wide ? Math.round(layout.width * 0.5) : layout.width;
  const imageHeight = wide
    ? layout.height
    : Math.round(layout.height * (tablet ? 0.56 : compact ? 0.48 : 0.56));
  const headline = tablet ? 46 : compact ? 29 : 35;

  // Para un familiar se empieza de cero; si no, se retoma donde quedó. Sin sesión, primero la cuenta.
  const begin = (forRelative: boolean) => {
    if (forRelative || !hasOnboardingProgress()) startOnboarding(forRelative);
    router.push(getSession() ? resumeHref() : '/bienvenida/cuenta');
  };

  // Solo en desarrollo: borra respuestas, progreso y sesión para ver el onboarding desde cero.
  const resetForTesting = () => {
    clearSession();
    clearProgress();
    clearPractices();
    // El idioma no es progreso: se queda como estaba.
    updateSettings({ ...DEFAULT_SETTINGS, language: getSettings().language });
    restoreOnboarding();
    Alert.alert(t('onboarding.devResetDone'));
  };

  const haveAccount = () => {
    router.push({ pathname: '/bienvenida/cuenta', params: { modo: 'entrar' } });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.background,
        flexDirection: wide ? 'row' : 'column',
      }}
    >
      <StatusBar style="light" />
      <View style={{ width: imageWidth, height: imageHeight }}>
        <WelcomeBackdrop
          width={imageWidth}
          height={imageHeight}
          gutter={layout.gutter}
          bottomInset={wide ? 0 : SHEET_RADIUS}
        />
        <View
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: layout.gutter,
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          <Squish
            onPress={() => router.push('/bienvenida/idioma')}
            haptic={false}
            accessibilityLabel={`${t('onboarding.language.change')}: ${LANGUAGE_NAMES[locale]}`}
            style={{
              height: 36,
              paddingHorizontal: 12,
              borderRadius: 18,
              backgroundColor: 'rgba(0, 0, 0, 0.32)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GlobeGlyph color={welcome.ink} size={16} />
            <Text weight="medium" color={welcome.ink} style={{ fontSize: 14, lineHeight: 18 }}>
              {LANGUAGE_NAMES[locale]}
            </Text>
          </Squish>
          {__DEV__ ? (
            <Squish
              onPress={resetForTesting}
              haptic={false}
              accessibilityLabel={t('onboarding.devReset')}
              style={{
                height: 36,
                paddingHorizontal: 14,
                borderRadius: 18,
                backgroundColor: 'rgba(0, 0, 0, 0.32)',
                justifyContent: 'center',
              }}
            >
              <Text weight="medium" color={welcome.ink} style={{ fontSize: 14, lineHeight: 18 }}>
                {t('onboarding.devReset')}
              </Text>
            </Squish>
          ) : null}
        </View>
        <View style={{ position: 'absolute', top: insets.top + 8, right: layout.gutter }}>
          <Squish
            onPress={haveAccount}
            haptic={false}
            accessibilityLabel={t('onboarding.haveAccount')}
            style={{
              height: 36,
              paddingHorizontal: 14,
              borderRadius: 18,
              backgroundColor: 'rgba(0, 0, 0, 0.32)',
              justifyContent: 'center',
            }}
          >
            <Text weight="medium" color={welcome.ink} style={{ fontSize: 14, lineHeight: 18 }}>
              {t('onboarding.haveAccount')}
            </Text>
          </Squish>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          marginTop: wide ? 0 : -SHEET_RADIUS,
          borderTopLeftRadius: wide ? 0 : SHEET_RADIUS,
          borderTopRightRadius: wide ? 0 : SHEET_RADIUS,
          backgroundColor: palette.background,
          paddingTop: wide ? insets.top + 40 : compact ? 24 : 32,
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + (compact ? 6 : 10),
          alignItems: 'center',
          justifyContent: wide ? 'center' : 'flex-start',
        }}
      >
        <View style={{ width: '100%', maxWidth: tablet ? 520 : 480, flex: wide ? undefined : 1 }}>
          <Animated.View
            entering={enter(0)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            accessible
            accessibilityRole="header"
            accessibilityLabel="Manta"
          >
            <Float amplitude={2} sway={5} periodMs={5000}>
              <MantaMark width={28} color={palette.accent} />
            </Float>
            <Text
              color={palette.ink}
              style={{ fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16, letterSpacing: 3 }}
            >
              MANTA
            </Text>
          </Animated.View>
          <View style={{ marginTop: compact ? 14 : 20 }}>
            <RevealText
              text={t('onboarding.tagline')}
              color={palette.ink}
              delay={180}
              stagger={90}
              maxFontSizeMultiplier={1.3}
              style={{
                fontFamily: fonts.semibold,
                fontSize: headline,
                lineHeight: Math.round(headline * 1.14),
                letterSpacing: -1,
              }}
            />
          </View>
          <Animated.View entering={enter(2)}>
            <Text
              color={palette.muted}
              style={{ marginTop: 12, fontSize: layout.bodySize, lineHeight: layout.bodyLine }}
            >
              {t('onboarding.welcomeBody')}
            </Text>
          </Animated.View>
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: compact ? 10 : 14 }}
          >
            {(['minutes', 'posture', 'offline'] as const).map((pill, index) => (
              <Animated.View
                key={pill}
                entering={ZoomIn.springify()
                  .damping(16)
                  .delay(500 + index * 110)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  height: 30,
                  paddingHorizontal: 10,
                  borderRadius: 15,
                  backgroundColor: palette.card,
                }}
              >
                {pill === 'minutes' ? (
                  <ClockGlyph color={palette.ink} size={14} strokeWidth={2} />
                ) : pill === 'posture' ? (
                  <PracticeIcon mode="both" color={palette.ink} size={14} />
                ) : (
                  <OfflineIcon usage="often" color={palette.ink} size={14} />
                )}
                <Text
                  weight="medium"
                  color={palette.ink}
                  maxFontSizeMultiplier={1.2}
                  style={{ fontSize: 12, lineHeight: 15 }}
                >
                  {t(`onboarding.welcomePills.${pill}`)}
                </Text>
              </Animated.View>
            ))}
          </View>
          <View style={{ flexGrow: 1, minHeight: compact ? 16 : 24 }} />
          <Animated.View entering={enter(3)} style={{ marginTop: wide ? 32 : 0 }}>
            <ContinueButton label={t('onboarding.start')} onPress={() => begin(false)} />
            <TextButton
              label={t('onboarding.forRelative')}
              color={palette.ink}
              onPress={() => begin(true)}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
