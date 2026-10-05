import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  trackStep,
  updateDraft,
  useOnboardingDraft,
  wantsAutoAnchor,
} from '@/features/onboarding/onboarding';
import { Option } from '@/features/onboarding/Option';
import { DownloadGlyph, OfflineIcon } from '@/features/onboarding/OptionIcons';
import { PoseArt } from '@/features/onboarding/PoseArt';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { NoteLine, StepScreen } from '@/features/onboarding/StepScreen';
import type { OfflineUsage } from '@/features/settings/settings';
import { Text } from '@/ui/Text';

const USAGES: readonly OfflineUsage[] = ['often', 'sometimes', 'rarely'];

/** Paso 5: ¿sin internet? Con "A menudo" o "A veces" las clases gratis se anclan solas con Wi-Fi. */
export default function OfflineStep() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const context = draft.forRelative ? 'relative' : undefined;
  const auto = wantsAutoAnchor(draft.offlineUsage);

  return (
    <StepScreen
      step="sin-internet"
      title={t('onboarding.offline.title', { context })}
      body={t('onboarding.offline.body')}
      onNext={() => {
        trackStep('sin-internet');
        router.push('/bienvenida/plan');
      }}
      after={
        <View style={{ marginTop: layout.gap }} accessibilityLiveRegion="polite">
          <NoteLine
            icon={<DownloadGlyph color={palette.body} />}
            text={t(auto ? 'onboarding.offline.auto' : 'onboarding.offline.manual')}
            color={palette.body}
          />
        </View>
      }
      art={<PoseArt poses={['seated']} maxHeight={layout.artMax * 0.9} />}
    >
      <View style={{ flexDirection: 'row', gap: layout.gap }}>
        {USAGES.map((usage) => (
          <Option
            key={usage}
            role="radio"
            selected={draft.offlineUsage === usage}
            onPress={() => updateDraft({ offlineUsage: usage })}
            accessibilityLabel={t(`onboarding.offline.${usage}`)}
            height={layout.tileHeight}
            style={{ flex: 1 }}
          >
            {(colors) => (
              <View
                style={{ alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 4 }}
              >
                <OfflineIcon
                  usage={usage}
                  color={colors.icon}
                  size={layout.breakpoint === 'tablet' ? 30 : 26}
                />
                <Text
                  align="center"
                  weight="medium"
                  color={colors.text}
                  style={{
                    fontSize: layout.labelSize - 1,
                    lineHeight: Math.round((layout.labelSize - 1) * 1.25),
                  }}
                >
                  {t(`onboarding.offline.${usage}`)}
                </Text>
              </View>
            )}
          </Option>
        ))}
      </View>
    </StepScreen>
  );
}
