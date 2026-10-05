import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { trackStep, updateDraft, useOnboardingDraft } from '@/features/onboarding/onboarding';
import { Option } from '@/features/onboarding/Option';
import { PracticeIcon } from '@/features/onboarding/OptionIcons';
import { PoseArt, type Pose } from '@/features/onboarding/PoseArt';
import { useOnboardingLayout } from '@/features/onboarding/responsive';
import { StepScreen } from '@/features/onboarding/StepScreen';
import type { PracticeMode } from '@/features/settings/settings';
import { Text } from '@/ui/Text';

const MODES: readonly PracticeMode[] = ['seated', 'standing', 'both'];

const POSES: Record<PracticeMode, readonly Pose[]> = {
  seated: ['seated'],
  standing: ['standing'],
  both: ['standing', 'seated'],
};

/** Paso 1: sentado, de pie o las dos. La figura cambia con la respuesta. */
export default function PracticeStep() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const context = draft.forRelative ? 'relative' : undefined;

  return (
    <StepScreen
      step="practica"
      title={t('onboarding.practice.title', { context })}
      body={t('onboarding.practice.body', { context })}
      onNext={() => {
        trackStep('practica');
        router.push('/bienvenida/sentir');
      }}
      art={<PoseArt poses={POSES[draft.practiceMode]} maxHeight={layout.artMax} />}
    >
      <View style={{ flexDirection: 'row', gap: layout.gap }}>
        {MODES.map((mode) => (
          <Option
            key={mode}
            role="radio"
            selected={draft.practiceMode === mode}
            onPress={() => updateDraft({ practiceMode: mode })}
            accessibilityLabel={t(`onboarding.practice.${mode}`)}
            height={layout.tileHeight}
            style={{ flex: 1 }}
          >
            {(colors) => (
              <View
                style={{ alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 4 }}
              >
                <PracticeIcon
                  mode={mode}
                  color={colors.icon}
                  size={layout.breakpoint === 'tablet' ? 32 : 28}
                />
                <Text
                  align="center"
                  weight="medium"
                  color={colors.text}
                  style={{
                    fontSize: layout.labelSize,
                    lineHeight: Math.round(layout.labelSize * 1.25),
                  }}
                >
                  {t(`onboarding.practice.${mode}`)}
                </Text>
              </View>
            )}
          </Option>
        ))}
      </View>
    </StepScreen>
  );
}
