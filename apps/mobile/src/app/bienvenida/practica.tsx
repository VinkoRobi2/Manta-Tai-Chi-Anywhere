import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { programsForMode } from '@/features/catalog/catalog';
import { CheckBadge, ChoiceCard } from '@/features/onboarding/ChoiceCard';
import {
  canContinue,
  trackStep,
  updateDraft,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding';
import type { Pose } from '@/features/onboarding/PoseArt';
import { PoseThumb } from '@/features/onboarding/PoseThumb';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { StepScreen } from '@/features/onboarding/StepScreen';
import type { PracticeMode } from '@/features/settings/settings';
import { useLocale } from '@/lib/i18n';

const MODES: readonly PracticeMode[] = ['seated', 'standing', 'both'];

const POSES: Record<PracticeMode, readonly Pose[]> = {
  seated: ['seated'],
  standing: ['standing'],
  both: ['standing', 'seated'],
};

/** Paso 1: sentado, de pie o las dos. Cada tarjeta lleva su ilustración. */
export default function PracticeStep() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const context = draft.forRelative ? 'relative' : undefined;
  const cardHeight =
    layout.breakpoint === 'tablet' ? 140 : layout.breakpoint === 'compact' ? 100 : 122;
  const artWidth = Math.round(cardHeight * 1.05);
  const locale = useLocale();
  // La primera clase que le tocaría con cada forma de practicar.
  const firstClass = (mode: PracticeMode) => {
    const lesson = programsForMode(locale, mode)[0]?.lessons[0];
    return lesson
      ? t('onboarding.practice.firstClass', {
          title: lesson.title,
          minutes: Math.round(lesson.durationSec / 60),
        })
      : undefined;
  };

  return (
    <StepScreen
      step="practica"
      title={t('onboarding.practice.title', { context })}
      body={t('onboarding.practice.body', { context })}
      canContinue={canContinue('practica', draft)}
      onContinue={() => {
        trackStep('practica');
        router.push('/bienvenida/sentir');
      }}
    >
      <View style={{ gap: layout.gap }}>
        {MODES.map((mode) => (
          <ChoiceCard
            key={mode}
            role="radio"
            selected={draft.practiceMode === mode}
            onPress={() => updateDraft({ practiceMode: mode })}
            label={t(`onboarding.practice.${mode}`)}
            description={t(`onboarding.practice.${mode}Body`)}
            badge={mode === 'seated' ? t('onboarding.practice.recommended') : undefined}
            detail={firstClass(mode)}
            minHeight={cardHeight}
            trailing={(colors) => (
              <View style={{ marginVertical: -12, marginRight: -16, alignSelf: 'stretch' }}>
                <PoseThumb
                  poses={POSES[mode]}
                  width={artWidth}
                  height={cardHeight}
                  figureHeight={cardHeight * 0.98}
                  sunSize={cardHeight * 0.62}
                  sunOffsetY={-cardHeight * 0.06}
                  sunColor={palette.accent}
                  tint={colors.selected ? palette.onSelected : palette.ink}
                  alive={colors.selected}
                />
                {colors.selected ? (
                  <View style={{ position: 'absolute', top: 12, right: 12 }}>
                    <CheckBadge size={22} />
                  </View>
                ) : null}
              </View>
            )}
          />
        ))}
      </View>
    </StepScreen>
  );
}
