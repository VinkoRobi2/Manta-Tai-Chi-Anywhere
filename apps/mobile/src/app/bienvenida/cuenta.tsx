import * as AppleAuthentication from 'expo-apple-authentication';
import { useNetworkState } from 'expo-network';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isAppleAvailable } from '@/features/auth/apple';
import { GoogleLogo } from '@/features/auth/GoogleLogo';
import { GoogleUnavailableError } from '@/features/auth/google';
import { enterAsGuest, signInWithApple, signInWithGoogle } from '@/features/auth/session';
import { restoreOnboarding, resumeHref } from '@/features/onboarding/onboarding';
import { LongArrow, OfflineIcon } from '@/features/onboarding/OptionIcons';
import { PoseArt } from '@/features/onboarding/PoseArt';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { NoteLine, SpacedLink } from '@/features/onboarding/StepScreen';
import { ApiError } from '@/lib/api';
import { fonts, radius } from '@/theme/tokens';
import { Press } from '@/ui/Press';
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
  const buttonHeight = tablet ? 64 : 58;

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
          paddingTop: insets.top + layout.topPad,
          paddingHorizontal: layout.gutter,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: layout.contentWidth }}>
          <Text
            accessibilityRole="header"
            align="center"
            color={palette.ink}
            maxFontSizeMultiplier={1.4}
            style={{
              fontFamily: fonts.extrabold,
              fontSize: layout.titleSize,
              lineHeight: layout.titleLine,
              letterSpacing: -0.2,
              textTransform: 'uppercase',
            }}
          >
            {t('onboarding.account.title', { context })}
          </Text>
          <Text
            align="center"
            color={palette.body}
            maxFontSizeMultiplier={1.6}
            style={{
              marginTop: layout.gap + 8,
              fontSize: layout.bodySize,
              lineHeight: layout.bodyLine,
              alignSelf: 'center',
              maxWidth: tablet ? 520 : 340,
            }}
          >
            {t('onboarding.account.body', { context })}
          </Text>
        </View>
      </View>

      {/* La figura usa el espacio que sobra: todo cabe en la pantalla sin scroll. */}
      <View style={{ flex: 1, minHeight: 0, marginVertical: layout.gap }}>
        <PoseArt poses={['rise']} maxHeight={layout.artMax * 0.8} />
      </View>

      <View
        style={{
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + (layout.breakpoint === 'compact' ? 4 : 12),
          alignItems: 'center',
        }}
      >
        <View
          style={{ width: '100%', maxWidth: tablet ? 440 : layout.contentWidth, gap: layout.gap }}
        >
          {offline ? (
            <NoteLine
              icon={<OfflineIcon usage="often" color={palette.body} size={16} />}
              text={t('onboarding.account.offline')}
              color={palette.body}
            />
          ) : (
            <>
              {appleAvailable ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={buttonHeight / 2}
                  style={{ width: '100%', height: buttonHeight }}
                  onPress={() => void signIn('apple')}
                />
              ) : null}
              <Press
                haptic
                onPress={() => void signIn('google')}
                accessibilityLabel={t('onboarding.account.google')}
                style={{
                  height: buttonHeight,
                  borderRadius: radius.pill,
                  borderWidth: 1.5,
                  borderColor: palette.line,
                  backgroundColor: palette.background,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  overflow: 'hidden',
                }}
              >
                <GoogleLogo size={20} />
                <Text
                  color={palette.ink}
                  weight="semibold"
                  maxFontSizeMultiplier={1.4}
                  style={{ fontSize: tablet ? 19 : 17, lineHeight: 22 }}
                >
                  {t('onboarding.account.google')}
                </Text>
              </Press>
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
              <Text variant="caption" color={palette.body}>
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
            <Press
              haptic
              onPress={guest}
              accessibilityLabel={t('onboarding.account.guest')}
              style={{
                minHeight: buttonHeight,
                borderRadius: radius.pill,
                backgroundColor: palette.ink,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 20,
                overflow: 'hidden',
              }}
            >
              <Text
                color={palette.background}
                maxFontSizeMultiplier={1.4}
                style={{
                  fontFamily: fonts.extrabold,
                  fontSize: tablet ? 16 : 14,
                  lineHeight: 20,
                  letterSpacing: 2.2,
                  textTransform: 'uppercase',
                }}
              >
                {t('onboarding.account.guest')}
              </Text>
            </Press>
          ) : (
            <SpacedLink label={t('onboarding.account.guest')} onPress={guest} />
          )}

          <View style={{ height: 48, justifyContent: 'center' }}>
            <Press
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.back')}
              hitSlop={8}
              style={{ height: 48, width: 48, justifyContent: 'center' }}
            >
              <LongArrow color={palette.ink} direction="left" width={28} />
            </Press>
          </View>
        </View>
      </View>
    </View>
  );
}
