import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { trackStep, updateDraft, useOnboardingDraft } from '@/features/onboarding/onboarding';
import { Option } from '@/features/onboarding/Option';
import { PoseArt } from '@/features/onboarding/PoseArt';
import { useOnboardingLayout } from '@/features/onboarding/responsive';
import { StepScreen } from '@/features/onboarding/StepScreen';
import { DAILY_MINUTES } from '@/features/settings/settings';
import { fonts } from '@/theme/tokens';
import { Text } from '@/ui/Text';

/** Paso 3: minutos al día. El anillo detrás de la figura se llena con la respuesta. */
export default function TimeStep() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const tablet = layout.breakpoint === 'tablet';
  const longest = DAILY_MINUTES[DAILY_MINUTES.length - 1];

  return (
    <StepScreen
      step="tiempo"
      title={t('onboarding.time.title')}
      body={t('onboarding.time.body')}
      onNext={() => {
        trackStep('tiempo');
        router.push('/bienvenida/zonas');
      }}
      art={
        <PoseArt
          poses={['standing']}
          backdrop={{ kind: 'ring', progress: draft.dailyMinutes / longest }}
          maxHeight={layout.artMax}
        />
      }
    >
      <View style={{ flexDirection: 'row', gap: layout.gap }}>
        {DAILY_MINUTES.map((minutes) => (
          <Option
            key={minutes}
            role="radio"
            selected={draft.dailyMinutes === minutes}
            onPress={() => updateDraft({ dailyMinutes: minutes })}
            accessibilityLabel={`${t('onboarding.time.option', { count: minutes })}. ${t(`onboarding.time.hint.${minutes}`)}`}
            height={layout.tileHeight + 8}
            style={{ flex: 1 }}
          >
            {(colors) => (
              <View style={{ alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 }}>
                <Text
                  color={colors.text}
                  maxFontSizeMultiplier={1.3}
                  style={{
                    fontFamily: fonts.extrabold,
                    fontSize: tablet ? 38 : 30,
                    lineHeight: tablet ? 44 : 34,
                  }}
                >
                  {minutes}
                </Text>
                <Text
                  color={colors.text}
                  weight="medium"
                  style={{
                    fontSize: 11,
                    lineHeight: 14,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                  }}
                >
                  {t('onboarding.time.unit')}
                </Text>
                <Text
                  align="center"
                  color={colors.text}
                  style={{ marginTop: 6, fontSize: tablet ? 15 : 13, lineHeight: tablet ? 20 : 17 }}
                >
                  {t(`onboarding.time.hint.${minutes}`)}
                </Text>
              </View>
            )}
          </Option>
        ))}
      </View>
    </StepScreen>
  );
}
