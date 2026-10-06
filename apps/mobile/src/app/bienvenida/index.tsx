import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getSession } from '@/features/auth/session';
import { ContinueButton, TextButton } from '@/features/onboarding/ContinueButton';
import {
  hasOnboardingProgress,
  resumeHref,
  startOnboarding,
} from '@/features/onboarding/onboarding';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { Squish } from '@/features/onboarding/Squish';
import { enter } from '@/features/onboarding/StepScreen';
import { WelcomeBackdrop } from '@/features/onboarding/WelcomeBackdrop';
import { fonts, welcome } from '@/theme/tokens';
import { MantaMark } from '@/ui/Brand';
import { Text } from '@/ui/Text';

const SHEET_RADIUS = 32;

/**
 * Bienvenida: arriba el amanecer en movimiento; abajo una hoja blanca con la marca,
 * la promesa y un solo botón. En pantallas anchas, imagen a la izquierda y texto a la derecha.
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const insets = useSafeAreaInsets();
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
        <WelcomeBackdrop width={imageWidth} height={imageHeight} />
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
            <MantaMark width={28} color={palette.accent} />
            <Text
              color={palette.ink}
              style={{ fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16, letterSpacing: 3 }}
            >
              MANTA
            </Text>
          </Animated.View>
          <Animated.View entering={enter(1)}>
            <Text
              color={palette.ink}
              maxFontSizeMultiplier={1.3}
              style={{
                marginTop: compact ? 14 : 20,
                fontFamily: fonts.semibold,
                fontSize: headline,
                lineHeight: Math.round(headline * 1.14),
                letterSpacing: -1,
              }}
            >
              {t('onboarding.tagline')}
            </Text>
          </Animated.View>
          <Animated.View entering={enter(2)}>
            <Text
              color={palette.muted}
              style={{ marginTop: 12, fontSize: layout.bodySize, lineHeight: layout.bodyLine }}
            >
              {t('onboarding.welcomeBody')}
            </Text>
          </Animated.View>
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
