import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ChoiceCard, IconTile } from '@/features/onboarding/ChoiceCard';
import { TextButton } from '@/features/onboarding/ContinueButton';
import { IconMotion } from '@/features/onboarding/IconMotion';
import {
  canContinue,
  ONBOARDING_CARE_TAGS,
  toggleCare,
  trackStep,
  updateDraft,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding';
import { ShieldGlyph, ZoneIcon } from '@/features/onboarding/OptionIcons';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { StepScreen } from '@/features/onboarding/StepScreen';
import { Text } from '@/ui/Text';

/**
 * Paso 4: zonas que cuidar. Mosaico de dos columnas, como "Qué quieres sentir": cada zona con su
 * dibujo y lo que cambia en las clases. "Ninguna" va a lo ancho, debajo.
 */
export default function CareStep() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const context = draft.forRelative ? 'relative' : undefined;
  const compact = layout.breakpoint === 'compact';
  const tileHeight = layout.breakpoint === 'tablet' ? 168 : compact ? 116 : 148;
  const iconSize = layout.breakpoint === 'tablet' ? 38 : compact ? 28 : 34;

  const next = () => {
    trackStep('zonas');
    router.push('/bienvenida/sin-internet');
  };

  return (
    <StepScreen
      step="zonas"
      title={t('onboarding.care.title')}
      body={t('onboarding.care.body')}
      canContinue={canContinue('zonas', draft)}
      onContinue={next}
      topRight={
        <TextButton
          label={t('onboarding.skip')}
          color={palette.muted}
          onPress={() => {
            updateDraft({ careTags: [], noCare: false });
            next();
          }}
        />
      }
      footnote={
        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 }}
        >
          <View style={{ paddingTop: 1 }}>
            <ShieldGlyph color={palette.muted} size={16} />
          </View>
          <Text variant="caption" color={palette.muted} style={{ flexShrink: 1 }}>
            {t('onboarding.care.safety')}
          </Text>
        </View>
      }
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: layout.gap }}>
        {ONBOARDING_CARE_TAGS.map((zone) => (
          <ChoiceCard
            key={zone}
            variant="tile"
            role="checkbox"
            selected={draft.careTags.includes(zone)}
            onPress={() => updateDraft(toggleCare(draft, zone))}
            label={t(`lesson.care.${zone}`)}
            // En teléfonos bajos, solo el nombre: así todo cabe sin scroll.
            description={compact ? undefined : t(`onboarding.care.adapt.${zone}`)}
            minHeight={tileHeight}
            containerStyle={{ flexGrow: 1, flexBasis: '40%' }}
            leading={(colors) => (
              <IconTile colors={colors} large>
                <IconMotion kind={zone} active={colors.selected}>
                  <ZoneIcon
                    zone={zone}
                    color={colors.text}
                    accent={palette.accent}
                    size={iconSize}
                  />
                </IconMotion>
              </IconTile>
            )}
          />
        ))}
        <ChoiceCard
          role="checkbox"
          selected={draft.noCare}
          onPress={() => updateDraft(toggleCare(draft, 'none'))}
          label={t('onboarding.care.none')}
          description={t('onboarding.care.noneBody', { context })}
          minHeight={layout.rowHeight}
          containerStyle={{ flexGrow: 1, flexBasis: '100%' }}
          leading={(colors) => (
            <IconTile colors={colors} large>
              <IconMotion kind="pulse" active={colors.selected}>
                <ZoneIcon zone="none" color={colors.icon} accent={palette.accent} size={iconSize} />
              </IconMotion>
            </IconTile>
          )}
        />
      </View>
    </StepScreen>
  );
}
