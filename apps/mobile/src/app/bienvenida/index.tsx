import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getSession } from '@/features/auth/session';
import {
  hasOnboardingProgress,
  resumeHref,
  startOnboarding,
} from '@/features/onboarding/onboarding';
import { useOnboardingLayout } from '@/features/onboarding/responsive';
import { WelcomeBackdrop } from '@/features/onboarding/WelcomeBackdrop';
import { fonts, radius, welcome } from '@/theme/tokens';
import { MantaMark } from '@/ui/Brand';
import { Press } from '@/ui/Press';
import { Text } from '@/ui/Text';

function WelcomeLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
    >
      <Text variant="caption" weight="medium" color={welcome.inkSoft}>
        {label}
      </Text>
    </Press>
  );
}

/** Bienvenida: el amanecer en movimiento, la marca y un solo botón. */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const tablet = layout.breakpoint === 'tablet';
  const compact = layout.breakpoint === 'compact';
  const wordSize = tablet ? 52 : compact ? 34 : 40;
  // La marca queda debajo de la figura: en tablets se separa más del botón.
  const brandGap = tablet ? layout.height * 0.14 : compact ? 20 : 44;

  // Para un familiar se empieza de cero; si no, se retoma donde quedó. Sin sesión, primero la cuenta.
  const begin = (forRelative: boolean) => {
    if (forRelative || !hasOnboardingProgress()) startOnboarding(forRelative);
    router.push(getSession() ? resumeHref() : '/bienvenida/cuenta');
  };

  const haveAccount = () => {
    router.push({ pathname: '/bienvenida/cuenta', params: { modo: 'entrar' } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: welcome.ground }}>
      <StatusBar style="light" />
      <WelcomeBackdrop />
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + (compact ? 8 : 16),
        }}
      >
        <View style={{ width: '100%', maxWidth: tablet ? 440 : 480 }}>
          <View style={{ alignItems: 'center', gap: compact ? 10 : 14, marginBottom: brandGap }}>
            <MantaMark width={tablet ? 64 : 52} color={welcome.sol} />
            <Text
              accessibilityRole="header"
              accessibilityLabel="Manta"
              color={welcome.ink}
              maxFontSizeMultiplier={1.2}
              style={{
                fontFamily: fonts.semibold,
                fontSize: wordSize,
                lineHeight: Math.round(wordSize * 1.15),
                letterSpacing: wordSize * 0.38,
                // El espaciado también se suma después de la última letra: esto lo compensa.
                paddingLeft: wordSize * 0.38,
              }}
            >
              MANTA
            </Text>
            <Text
              align="center"
              color={welcome.inkSoft}
              style={{
                fontSize: tablet ? 20 : compact ? 16 : 17,
                lineHeight: tablet ? 28 : 24,
              }}
            >
              {t('onboarding.tagline')}
            </Text>
          </View>

          <Press
            haptic
            onPress={() => begin(false)}
            accessibilityLabel={t('onboarding.start')}
            style={{
              height: tablet ? 64 : 58,
              borderRadius: radius.pill,
              backgroundColor: welcome.sol,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Text
              color={welcome.onSol}
              maxFontSizeMultiplier={1.4}
              style={{
                fontFamily: fonts.extrabold,
                fontSize: tablet ? 17 : 15,
                lineHeight: 20,
                letterSpacing: 3,
                textTransform: 'uppercase',
              }}
            >
              {t('onboarding.start')}
            </Text>
          </Press>

          <View
            style={{
              flexDirection: tablet ? 'row' : 'column',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: compact ? 2 : 8,
            }}
          >
            <WelcomeLink label={t('onboarding.haveAccount')} onPress={haveAccount} />
            {tablet ? (
              <Text
                variant="caption"
                color={welcome.separator}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                ·
              </Text>
            ) : null}
            <WelcomeLink label={t('onboarding.forRelative')} onPress={() => begin(true)} />
          </View>
        </View>
      </View>
    </View>
  );
}
