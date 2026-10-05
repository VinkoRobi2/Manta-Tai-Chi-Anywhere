import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  toggleGoal,
  trackStep,
  updateDraft,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding';
import { Option } from '@/features/onboarding/Option';
import { GoalIcon } from '@/features/onboarding/OptionIcons';
import { PoseArt } from '@/features/onboarding/PoseArt';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { StepScreen } from '@/features/onboarding/StepScreen';
import { GOALS } from '@/features/settings/settings';
import { Text } from '@/ui/Text';

/** Paso 2: qué quiere sentir, hasta dos. */
export default function FeelStep() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const context = draft.forRelative ? 'relative' : undefined;

  return (
    <StepScreen
      step="sentir"
      title={t('onboarding.feel.title', { context })}
      body={t('onboarding.feel.body', { context })}
      onNext={() => {
        trackStep('sentir');
        router.push('/bienvenida/tiempo');
      }}
      after={
        <Text
          variant="caption"
          align="center"
          weight="medium"
          color={palette.ink}
          accessibilityLiveRegion="polite"
          style={{ marginTop: layout.gap + 8, letterSpacing: 3.5, textTransform: 'uppercase' }}
        >
          {t('onboarding.feel.limit', { count: draft.goals.length })}
        </Text>
      }
      art={<PoseArt poses={['rise']} maxHeight={layout.artMax * 0.8} />}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: layout.gap }}>
        {GOALS.map((goal, index) => {
          // Cuatro en dos columnas y la última a lo ancho, como en el diseño.
          const fullWidth = index === GOALS.length - 1 && GOALS.length % 2 === 1;
          return (
            <Option
              key={goal}
              role="checkbox"
              selected={draft.goals.includes(goal)}
              onPress={() => updateDraft({ goals: toggleGoal(draft.goals, goal) })}
              accessibilityLabel={t(`onboarding.feel.${goal}`)}
              height={layout.optionHeight}
              style={{
                flexGrow: 1,
                flexBasis: fullWidth ? '100%' : '40%',
              }}
            >
              {(colors) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                  }}
                >
                  <GoalIcon goal={goal} color={colors.icon} />
                  <Text
                    weight="medium"
                    color={colors.text}
                    style={{
                      flexShrink: 1,
                      fontSize: layout.labelSize,
                      lineHeight: Math.round(layout.labelSize * 1.2),
                    }}
                  >
                    {t(`onboarding.feel.${goal}`)}
                  </Text>
                </View>
              )}
            </Option>
          );
        })}
      </View>
    </StepScreen>
  );
}
