import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/theme/tokens';
import { Text } from '@/ui/Text';

import { ContinueButton } from './ContinueButton';
import {
  markScreen,
  ONBOARDING_STEPS,
  SCREEN_HREF,
  stepNumber,
  useOnboardingDraft,
  type OnboardingStep,
} from './onboarding';
import { useOnboardingLayout, useOnboardingPalette } from './responsive';
import { TopBar } from './TopBar';

/** Entrada suave del contenido: sube unos píxeles mientras aparece. */
export function enter(index: number) {
  return FadeInDown.duration(420).delay(60 + index * 50);
}

export interface StepScreenProps {
  step: OnboardingStep;
  title: string;
  body: string;
  /** Las opciones. */
  children: ReactNode;
  /** Lo que va debajo de las opciones. */
  after?: ReactNode;
  /** Una línea fija justo encima del botón (la nota de seguridad). */
  footnote?: ReactNode;
  /** A la derecha de la barra de progreso ("Saltar"). */
  topRight?: ReactNode;
  canContinue: boolean;
  onContinue: () => void;
}

/**
 * Estructura de cada pregunta, como en las mejores apps de hoy: arriba volver y el progreso;
 * un título grande alineado a la izquierda; las respuestas en tarjetas; y abajo, fijo,
 * un solo botón "Continuar" que se activa al responder. Si la letra del sistema está muy
 * grande, el contenido hace scroll y el botón sigue a la vista.
 */
export function StepScreen({
  step,
  title,
  body,
  children,
  after,
  footnote,
  topRight,
  canContinue,
  onContinue,
}: StepScreenProps) {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const draft = useOnboardingDraft();
  const current = stepNumber(step);
  const total = ONBOARDING_STEPS.length;
  const column = { width: '100%', maxWidth: layout.contentWidth } as const;
  // En tablets el bloque de la pregunta va centrado en la pantalla, como una hoja.
  const centered = layout.breakpoint === 'tablet';

  useFocusEffect(useCallback(() => markScreen(step), [step]));

  // Si se retomó a mitad, la pregunta anterior no está detrás: se abre igual.
  const previous = ONBOARDING_STEPS[current - 2];
  const goBack = () => {
    if (previous) router.dismissTo(SCREEN_HREF[previous]);
    else if (router.canGoBack()) router.back();
    else router.replace('/bienvenida');
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style={palette.scheme === 'dark' ? 'light' : 'dark'} />
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingHorizontal: layout.gutter,
          alignItems: 'center',
        }}
      >
        <View style={column}>
          <TopBar
            step={current}
            total={total}
            right={topRight}
            progressLabel={t('onboarding.progress', { current, total })}
            onBack={goBack}
          />
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
          paddingBottom: centered ? layout.topPad * 2 : layout.gap * 2,
        }}
      >
        <View style={[column, { flexGrow: centered ? 0 : 1 }]}>
          {draft.forRelative ? (
            <Animated.View entering={enter(0)} style={{ marginBottom: 12, flexDirection: 'row' }}>
              <View
                style={{
                  paddingHorizontal: 12,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: palette.card,
                  justifyContent: 'center',
                }}
              >
                <Text variant="caption" weight="medium" color={palette.ink}>
                  {t('onboarding.relative')}
                </Text>
              </View>
            </Animated.View>
          ) : null}
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
              {title}
            </Text>
          </Animated.View>
          <Animated.View entering={enter(1)}>
            <Text
              color={palette.muted}
              maxFontSizeMultiplier={1.6}
              style={{ marginTop: 10, fontSize: layout.bodySize, lineHeight: layout.bodyLine }}
            >
              {body}
            </Text>
          </Animated.View>
          <Animated.View
            entering={enter(2)}
            style={{ marginTop: layout.sectionGap, flexGrow: centered ? 0 : 1 }}
          >
            {children}
            {after}
          </Animated.View>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: layout.gutter,
          paddingTop: 8,
          paddingBottom: insets.bottom + (layout.breakpoint === 'compact' ? 10 : 16),
          alignItems: 'center',
          backgroundColor: palette.background,
        }}
      >
        <View style={[column, { gap: 10 }]}>
          {footnote}
          <ContinueButton
            label={t('onboarding.continue')}
            disabled={!canContinue}
            onPress={onContinue}
          />
        </View>
      </View>
    </View>
  );
}
