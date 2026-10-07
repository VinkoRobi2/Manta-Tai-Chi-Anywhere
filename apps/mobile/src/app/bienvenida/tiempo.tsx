import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ClassAnatomy, MinutesDial, MinutesSegmented } from '@/features/onboarding/MinutesPicker';
import {
  canContinue,
  trackStep,
  updateDraft,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { StepScreen } from '@/features/onboarding/StepScreen';
import { Text } from '@/ui/Text';

/** Paso 3: minutos al día. Un número grande dentro del anillo del sol y un selector deslizante. */
export default function TimeStep() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const dial = Math.min(layout.artMax * 0.82, layout.width - layout.gutter * 2 - 40);

  return (
    <StepScreen
      step="tiempo"
      title={t('onboarding.time.title')}
      body={t('onboarding.time.body')}
      canContinue={canContinue('tiempo', draft)}
      onContinue={() => {
        trackStep('tiempo');
        router.push('/bienvenida/zonas');
      }}
    >
      <View style={{ flexGrow: 1, justifyContent: 'space-between', gap: layout.sectionGap }}>
        <View style={{ flexGrow: 1, justifyContent: 'center', gap: layout.gap + 6 }}>
          <MinutesDial minutes={draft.dailyMinutes} size={dial} />
          <ClassAnatomy minutes={draft.dailyMinutes} />
        </View>
        <View style={{ gap: 14 }}>
          <MinutesSegmented
            value={draft.dailyMinutes}
            onChange={(minutes) => updateDraft({ dailyMinutes: minutes })}
          />
          <Animated.View key={draft.dailyMinutes} entering={FadeIn.duration(240)}>
            <Text
              align="center"
              color={palette.muted}
              accessibilityLiveRegion="polite"
              style={{ fontSize: layout.bodySize, lineHeight: layout.bodyLine }}
            >
              {t(`onboarding.time.hint.${draft.dailyMinutes}`)}
            </Text>
          </Animated.View>
        </View>
      </View>
    </StepScreen>
  );
}
