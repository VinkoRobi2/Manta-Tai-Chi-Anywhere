import * as AppleAuthentication from 'expo-apple-authentication';
import { useNetworkState } from 'expo-network';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isAppleAvailable } from '@/features/auth/apple';
import { GoogleLogo } from '@/features/auth/GoogleLogo';
import { GoogleUnavailableError } from '@/features/auth/google';
import { enterAsGuest, signInWithApple, signInWithGoogle } from '@/features/auth/session';
import { AccountArt } from '@/features/onboarding/AccountArt';
import { ContinueButton, TextButton } from '@/features/onboarding/ContinueButton';
import { restoreOnboarding, resumeHref } from '@/features/onboarding/onboarding';
import { OfflineIcon } from '@/features/onboarding/OptionIcons';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { Squish } from '@/features/onboarding/Squish';
import { enter } from '@/features/onboarding/StepScreen';
import { BackButton } from '@/features/onboarding/TopBar';
import { ApiError } from '@/lib/api';
import { fonts } from '@/theme/tokens';
import { Text } from '@/ui/Text';

type Provider = 'apple' | 'google';

/** Qué decirle a la persona cuando no pudo entrar. */
function errorKey(error: unknown): string {
  if (error instanceof GoogleUnavailableError) {
    return error.reason === 'expo-go'
      ? 'onboarding.account.error.googleExpoGo'
      : 'onboarding.account.error.googleSetup';
  }
  if (error instanceof ApiError) {
    return error.status === 401
      ? 'onboarding.account.error.rejected'
      : 'onboarding.account.error.server';
  }
  // Sin respuesta del servidor: sin señal, o la API apagada.
  if (error instanceof TypeError || (error instanceof Error && error.name === 'AbortError')) {
    return 'onboarding.account.error.network';
  }
  return 'onboarding.account.error.generic';
}

/**
 * Entrar con Apple (en iPhone), con Google o como invitado. Sin internet solo queda entrar
 * como invitado: el progreso se guarda en el teléfono y se sube cuando haya cuenta y señal.
 * Como las preguntas: arriba volver, un título grande a la izquierda y abajo los botones.
 */
export default function AccountScreen() {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const context = modo === 'entrar' ? 'signin' : undefined;
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tablet = layout.breakpoint === 'tablet';
  const column = { width: '100%', maxWidth: tablet ? 600 : 520 } as const;
  // En tablets el bloque va centrado en la pantalla, como en las preguntas.
  const centered = tablet;
  // Sin Apple (Android y web), Google es la opción principal: va en negro.
  const googlePrimary = !appleAvailable;

  useEffect(() => {
    void isAppleAvailable().then(setAppleAvailable);
  }, []);

  // Al entrar se sigue donde quedó la persona: su progreso pudo llegar de la nube.
  const continueOnboarding = () => {
    restoreOnboarding();
    router.replace(resumeHref());
  };

  const signIn = async (provider: Provider) => {
    if (busy) return;
    setError(null);
    setBusy(provider);
    try {
      const entered = provider === 'apple' ? await signInWithApple() : await signInWithGoogle();
      if (entered) continueOnboarding();
    } catch (cause) {
      setError(errorKey(cause));
    } finally {
      setBusy(null);
    }
  };

  const guest = () => {
    enterAsGuest();
    continueOnboarding();
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/bienvenida');
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style="dark" />
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingHorizontal: layout.gutter,
          alignItems: 'center',
        }}
      >
        <View style={[column, { height: 56, flexDirection: 'row', alignItems: 'center' }]}>
          <BackButton onPress={goBack} />
        </View>
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: centered ? 'center' : 'flex-start',
          paddingTop: layout.topPad,
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + (layout.breakpoint === 'compact' ? 10 : 16),
        }}
      >
        <View style={[column, { flexGrow: centered ? 0 : 1 }]}>
          <Animated.View entering={enter(0)}>
            <Text
              accessibilityRole="header"
              color={palette.ink}
              maxFontSizeMultiplier={1.4}
              style={{
                fontFamily: fonts.semibold,
                fontSize: layout.titleSize,
                lineHeight: layout.titleLine,
                letterSpacing: -0.8,
              }}
            >
              {t('onboarding.account.title', { context })}
            </Text>
          </Animated.View>
          <Animated.View entering={enter(1)}>
            <Text
              color={palette.muted}
              maxFontSizeMultiplier={1.6}
              style={{ marginTop: 10, fontSize: layout.bodySize, lineHeight: layout.bodyLine }}
            >
              {t('onboarding.account.body', { context })}
            </Text>
          </Animated.View>

          {/* La figura va centrada en el espacio que sobra; con la letra muy grande desaparece. */}
          <Animated.View
            entering={enter(2)}
            style={
              centered
                ? {
                    height: Math.min(layout.artMax + 40, layout.height * 0.32),
                    marginVertical: layout.sectionGap,
                  }
                : { flex: 1, minHeight: 0, marginVertical: layout.gap, justifyContent: 'center' }
            }
          >
            <View style={{ height: layout.artMax + 40, flexShrink: 1 }}>
              <AccountArt maxHeight={layout.artMax} />
            </View>
          </Animated.View>

          <Animated.View
            entering={enter(3)}
            style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: 10 }}
          >
            {offline ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: palette.line,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: palette.card,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <OfflineIcon usage="often" color={palette.ink} size={18} />
                </View>
                <Text variant="caption" color={palette.ink} style={{ flexShrink: 1, fontSize: 15 }}>
                  {t('onboarding.account.offline')}
                </Text>
              </View>
            ) : (
              <>
                {appleAvailable ? (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={layout.buttonHeight / 2}
                    style={{ width: '100%', height: layout.buttonHeight }}
                    onPress={() => void signIn('apple')}
                  />
                ) : null}
                <Squish
                  onPress={() => void signIn('google')}
                  accessibilityLabel={t('onboarding.account.google')}
                  pressedScale={0.98}
                  style={{
                    height: layout.buttonHeight,
                    borderRadius: layout.buttonHeight / 2,
                    borderWidth: googlePrimary ? 0 : 1.5,
                    borderColor: palette.line,
                    backgroundColor: googlePrimary ? palette.selected : palette.background,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    paddingHorizontal: 24,
                  }}
                >
                  <GoogleLogo size={20} />
                  <Text
                    weight="semibold"
                    color={googlePrimary ? palette.onSelected : palette.ink}
                    maxFontSizeMultiplier={1.4}
                    style={{ fontSize: tablet ? 19 : 17, lineHeight: 22, letterSpacing: -0.1 }}
                  >
                    {t('onboarding.account.google')}
                  </Text>
                </Squish>
              </>
            )}

            {busy ? (
              <View
                accessibilityLiveRegion="polite"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  minHeight: 24,
                }}
              >
                <ActivityIndicator color={palette.ink} />
                <Text variant="caption" color={palette.muted}>
                  {t('onboarding.account.busy')}
                </Text>
              </View>
            ) : error ? (
              <Text
                variant="caption"
                align="center"
                color={palette.danger}
                accessibilityLiveRegion="polite"
              >
                {t(error)}
              </Text>
            ) : null}

            {offline ? (
              <ContinueButton label={t('onboarding.account.guest')} onPress={guest} />
            ) : (
              <TextButton label={t('onboarding.account.guest')} onPress={guest} />
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
