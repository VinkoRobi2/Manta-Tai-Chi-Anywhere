import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ChoiceCard, IconTile } from '@/features/onboarding/ChoiceCard';
import {
  canContinue,
  trackStep,
  updateDraft,
  useOnboardingDraft,
  wantsAutoAnchor,
} from '@/features/onboarding/onboarding';
import { IconMotion } from '@/features/onboarding/IconMotion';
import { Float } from '@/features/onboarding/motion';
import { DownloadGlyph, OfflineIcon } from '@/features/onboarding/OptionIcons';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { StepScreen } from '@/features/onboarding/StepScreen';
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
  const iconSize = layout.breakpoint === 'compact' ? 20 : 24;

  return (
    <StepScreen
      step="sin-internet"
      title={t('onboarding.offline.title', { context })}
      body={t('onboarding.offline.body')}
      canContinue={canContinue('sin-internet', draft)}
      onContinue={() => {
        trackStep('sin-internet');
        router.push('/bienvenida/creando');
      }}
      after={
        draft.offlineUsage ? (
          <Animated.View
            key={wantsAutoAnchor(draft.offlineUsage) ? 'auto' : 'manual'}
            entering={FadeIn.duration(260)}
            accessibilityLiveRegion="polite"
            style={{
              marginTop: layout.gap + 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: palette.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Float amplitude={2} periodMs={1400}>
                <DownloadGlyph color={palette.onAccent} size={18} />
              </Float>
            </View>
            <Text variant="caption" color={palette.ink} style={{ flexShrink: 1, fontSize: 15 }}>
              {t(
                wantsAutoAnchor(draft.offlineUsage)
                  ? 'onboarding.offline.auto'
                  : 'onboarding.offline.manual',
              )}
            </Text>
          </Animated.View>
        ) : null
      }
    >
      <View style={{ gap: layout.gap }}>
        {USAGES.map((usage) => (
          <ChoiceCard
            key={usage}
            role="radio"
            selected={draft.offlineUsage === usage}
            onPress={() => updateDraft({ offlineUsage: usage })}
            label={t(`onboarding.offline.${usage}`)}
            description={t(`onboarding.offline.${usage}Body`)}
            leading={(colors) => (
              <IconTile colors={colors}>
                <IconMotion kind="signal" active={colors.selected}>
                  <OfflineIcon usage={usage} color={colors.icon} size={iconSize} />
                </IconMotion>
              </IconTile>
            )}
          />
        ))}
      </View>
    </StepScreen>
  );
}
