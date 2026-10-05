import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  ONBOARDING_CARE_TAGS,
  toggleCare,
  trackStep,
  updateDraft,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding';
import { Option, type OptionColors } from '@/features/onboarding/Option';
import { CheckGlyph, ShieldGlyph } from '@/features/onboarding/OptionIcons';
import { PoseArt, type ZoneMarker } from '@/features/onboarding/PoseArt';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { NoteLine, SpacedLink, StepScreen } from '@/features/onboarding/StepScreen';
import { Text } from '@/ui/Text';

function CareLabel({ label, colors, size }: { label: string; colors: OptionColors; size: number }) {
  const palette = useOnboardingPalette();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        paddingLeft: 18,
        paddingRight: 14,
        paddingVertical: 8,
      }}
    >
      <Text
        weight="medium"
        color={colors.text}
        style={{ flexShrink: 1, fontSize: size, lineHeight: Math.round(size * 1.2) }}
      >
        {label}
      </Text>
      <View
        style={{
          width: 20,
          height: 20,
          borderWidth: 1.5,
          borderColor: colors.selected ? palette.accent : palette.iconOff,
          backgroundColor: colors.selected ? palette.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {colors.selected ? <CheckGlyph color={palette.onAccent} /> : null}
      </View>
    </View>
  );
}

/** Paso 4: zonas que cuidar. Las elegidas se marcan sobre la figura. */
export default function CareStep() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();

  const next = () => {
    trackStep('zonas');
    router.push('/bienvenida/sin-internet');
  };

  return (
    <StepScreen
      step="zonas"
      title={t('onboarding.care.title')}
      body={t('onboarding.care.body')}
      onNext={next}
      after={
        <SpacedLink
          label={t('onboarding.skip')}
          onPress={() => {
            updateDraft({ careTags: [], noCare: false });
            next();
          }}
        />
      }
      art={
        <PoseArt
          poses={['standing']}
          markers={draft.careTags.filter((tag): tag is ZoneMarker => tag !== 'wrists')}
          maxHeight={layout.artMax * 0.82}
        />
      }
      footnote={
        <NoteLine
          icon={<ShieldGlyph color={palette.muted} />}
          text={t('onboarding.care.safety')}
          color={palette.muted}
        />
      }
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: layout.gap }}>
        {ONBOARDING_CARE_TAGS.map((tag) => (
          <Option
            key={tag}
            role="checkbox"
            selected={draft.careTags.includes(tag)}
            onPress={() => updateDraft(toggleCare(draft, tag))}
            accessibilityLabel={t(`lesson.care.${tag}`)}
            height={layout.optionHeight - 6}
            style={{ flexGrow: 1, flexBasis: '40%' }}
          >
            {(colors) => (
              <CareLabel label={t(`lesson.care.${tag}`)} colors={colors} size={layout.labelSize} />
            )}
          </Option>
        ))}
        <Option
          role="checkbox"
          selected={draft.noCare}
          onPress={() => updateDraft(toggleCare(draft, 'none'))}
          accessibilityLabel={t('onboarding.care.none')}
          height={layout.optionHeight - 6}
          style={{ flexBasis: '100%' }}
        >
          {(colors) => (
            <CareLabel label={t('onboarding.care.none')} colors={colors} size={layout.labelSize} />
          )}
        </Option>
      </View>
    </StepScreen>
  );
}
