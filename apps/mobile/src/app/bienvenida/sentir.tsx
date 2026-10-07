import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ChoiceCard, IconTile } from '@/features/onboarding/ChoiceCard';
import {
  canContinue,
  MAX_GOALS,
  toggleGoal,
  trackStep,
  updateDraft,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding';
import { IconMotion } from '@/features/onboarding/IconMotion';
import { GoalIcon } from '@/features/onboarding/OptionIcons';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { StepScreen } from '@/features/onboarding/StepScreen';
import { GOALS } from '@/features/settings/settings';
import { Text } from '@/ui/Text';

/** Paso 2: qué quiere sentir, hasta dos. Mosaico de dos columnas; la última va a lo ancho. */
export default function FeelStep() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const context = draft.forRelative ? 'relative' : undefined;
  const tileHeight =
    layout.breakpoint === 'tablet' ? 168 : layout.breakpoint === 'compact' ? 128 : 148;
  const iconSize = layout.breakpoint === 'compact' ? 20 : 24;

  return (
    <StepScreen
      step="sentir"
      title={t('onboarding.feel.title', { context })}
      body={t('onboarding.feel.body', { context })}
      canContinue={canContinue('sentir', draft)}
      onContinue={() => {
        trackStep('sentir');
        router.push('/bienvenida/tiempo');
      }}
      after={
        <Text
          variant="caption"
          weight="medium"
          align="right"
          color={palette.muted}
          accessibilityLiveRegion="polite"
          style={{ marginTop: layout.gap }}
        >
          {t('onboarding.feel.limit', { count: draft.goals.length, max: MAX_GOALS })}
        </Text>
      }
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: layout.gap }}>
        {GOALS.map((goal, index) => {
          const fullWidth = index === GOALS.length - 1 && GOALS.length % 2 === 1;
          return (
            <ChoiceCard
              key={goal}
              variant={fullWidth ? 'row' : 'tile'}
              role="checkbox"
              selected={draft.goals.includes(goal)}
              onPress={() => updateDraft({ goals: toggleGoal(draft.goals, goal) })}
              label={t(`onboarding.feel.${goal}`)}
              description={t(`onboarding.feel.benefit.${goal}`)}
              minHeight={fullWidth ? layout.rowHeight : tileHeight}
              containerStyle={{ flexGrow: 1, flexBasis: fullWidth ? '100%' : '40%' }}
              leading={(colors) => (
                <IconTile colors={colors}>
                  <IconMotion kind={goal} active={colors.selected}>
                    <GoalIcon goal={goal} color={colors.icon} size={iconSize} />
                  </IconMotion>
                </IconTile>
              )}
            />
          );
        })}
      </View>
    </StepScreen>
  );
}
