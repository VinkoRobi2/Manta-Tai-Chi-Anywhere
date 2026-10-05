import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/theme/tokens';
import { Press } from '@/ui/Press';
import { Text } from '@/ui/Text';

import {
  ONBOARDING_STEPS,
  stepNumber,
  useOnboardingDraft,
  type OnboardingStep,
} from './onboarding';
import { LongArrow } from './OptionIcons';
import { useOnboardingLayout, useOnboardingPalette } from './responsive';

export interface StepScreenProps {
  step: OnboardingStep;
  title: string;
  body: string;
  /** Las opciones. */
  children: ReactNode;
  /** Lo que va debajo de las opciones (un enlace "Saltar", una nota). */
  after?: ReactNode;
  /** La imagen grande. */
  art?: ReactNode;
  /** Una línea fija justo encima de la barra inferior (la nota de seguridad). */
  footnote?: ReactNode;
  onNext: () => void;
}

/**
 * Estructura de cada pregunta: título en mayúsculas, texto, opciones, la figura grande
 * y abajo "1/5 · SIGUIENTE ⟶". En pantallas anchas, preguntas a la izquierda y figura a la derecha.
 * Si la letra del sistema está muy grande, todo hace scroll en lugar de cortarse.
 */
export function StepScreen({
  step,
  title,
  body,
  children,
  after,
  art,
  footnote,
  onNext,
}: StepScreenProps) {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const draft = useOnboardingDraft();
  const current = stepNumber(step);
  const total = ONBOARDING_STEPS.length;
  const tablet = layout.breakpoint === 'tablet';
  const compact = layout.breakpoint === 'compact';

  const questions = (
    <View>
      {draft.forRelative ? (
        <Text
          variant="label"
          align="center"
          color={palette.muted}
          style={{ marginBottom: layout.gap, letterSpacing: 2.4 }}
        >
          {t('onboarding.relative')}
        </Text>
      ) : null}
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
        {title}
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
          maxWidth: layout.breakpoint === 'tablet' ? 520 : 340,
        }}
      >
        {body}
      </Text>
      <View style={{ marginTop: layout.sectionGap, gap: layout.gap }}>{children}</View>
      {after}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style={palette.scheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingTop: insets.top + layout.topPad,
          paddingHorizontal: layout.gutter,
          paddingBottom: layout.gap,
        }}
      >
        <View
          style={{
            flexGrow: 1,
            width: '100%',
            maxWidth: layout.contentWidth,
            flexDirection: layout.wide ? 'row' : 'column',
            alignItems: layout.wide ? 'center' : 'stretch',
            gap: layout.wide ? layout.gutter * 1.5 : layout.gap * 2,
          }}
        >
          <View style={layout.wide ? { flex: 1, maxWidth: 520 } : undefined}>{questions}</View>
          {art ? (
            <View
              style={
                layout.wide
                  ? { flex: 1, alignSelf: 'stretch', minHeight: layout.artMin }
                  : { flexGrow: 1, minHeight: layout.artMin }
              }
            >
              {art}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {footnote ? (
        <View style={{ paddingHorizontal: layout.gutter, alignItems: 'center' }}>{footnote}</View>
      ) : null}

      <View
        style={{
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + (layout.breakpoint === 'compact' ? 4 : 12),
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: layout.contentWidth,
            height: layout.footerHeight,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* El contador va centrado en la pantalla, no entre los dos botones. */}
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}
          >
            <Text
              color={palette.ink}
              accessibilityLabel={t('onboarding.progress', { current, total })}
              maxFontSizeMultiplier={1.2}
              style={{
                fontFamily: fonts.extrabold,
                fontSize: tablet ? 22 : 18,
                lineHeight: 26,
                letterSpacing: 2.4,
              }}
            >
              {current}/{total}
            </Text>
          </View>
          <Press
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.back')}
            hitSlop={8}
            style={{ height: 48, minWidth: 48, justifyContent: 'center' }}
          >
            <LongArrow color={palette.ink} direction="left" width={28} />
          </Press>
          <Press
            haptic
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.next')}
            hitSlop={8}
            style={{ height: 48, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <Text
              color={palette.ink}
              maxFontSizeMultiplier={1.2}
              style={{
                fontFamily: fonts.extrabold,
                fontSize: tablet ? 16 : compact ? 12 : 13,
                lineHeight: 20,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {t('onboarding.next')}
            </Text>
            <LongArrow color={palette.ink} width={tablet ? 28 : 24} />
          </Press>
        </View>
      </View>
    </View>
  );
}

/** El enlace con letras espaciadas, como "PREFER NOT TO SAY". */
export function SpacedLink({ label, onPress }: { label: string; onPress: () => void }) {
  const palette = useOnboardingPalette();
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        alignSelf: 'center',
        minHeight: 48,
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}
    >
      <Text
        variant="caption"
        color={palette.ink}
        weight="medium"
        style={{ letterSpacing: 4, textTransform: 'uppercase' }}
      >
        {label}
      </Text>
    </Press>
  );
}

/** Una nota pequeña con icono (seguridad, aviso de descarga). Centrada; si ocupa dos líneas, el icono va arriba. */
export function NoteLine({ icon, text, color }: { icon: ReactNode; text: string; color: string }) {
  return (
    <View
      style={{
        alignSelf: 'center',
        maxWidth: 360,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingVertical: 6,
      }}
    >
      <View style={{ paddingTop: 2 }}>{icon}</View>
      <Text variant="caption" color={color} style={{ flexShrink: 1 }}>
        {text}
      </Text>
    </View>
  );
}
