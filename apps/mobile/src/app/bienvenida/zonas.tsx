import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { CheckBadge, ChoiceChip } from '@/features/onboarding/ChoiceCard';
import { TextButton } from '@/features/onboarding/ContinueButton';
import {
  canContinue,
  ONBOARDING_CARE_TAGS,
  toggleCare,
  trackStep,
  updateDraft,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding';
import { ShieldGlyph } from '@/features/onboarding/OptionIcons';
import { PoseArt, type ZoneMarker } from '@/features/onboarding/PoseArt';
import { useOnboardingLayout, useOnboardingPalette } from '@/features/onboarding/responsive';
import { StepScreen } from '@/features/onboarding/StepScreen';
import { Text } from '@/ui/Text';

/** Paso 4: zonas que cuidar. A la izquierda la figura con las zonas marcadas; a la derecha, las zonas. */
export default function CareStep() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
  const palette = useOnboardingPalette();
  const chipHeight =
    layout.breakpoint === 'tablet' ? 56 : layout.breakpoint === 'compact' ? 44 : 50;
  const artHeight =
    layout.breakpoint === 'tablet' ? 380 : layout.breakpoint === 'compact' ? 250 : 300;

  const marked = draft.careTags.filter((tag): tag is ZoneMarker => tag !== 'wrists');

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
      after={<Adaptations zones={marked} none={draft.noCare} />}
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: layout.gap }}>
        <View style={{ width: '42%', height: artHeight }}>
          <PoseArt
            poses={['standing']}
            markers={marked}
            maxHeight={artHeight * 0.9}
            onToggleZone={(zone) => updateDraft(toggleCare(draft, zone))}
          />
        </View>
        <View style={{ flex: 1, gap: layout.gap - 2 }}>
          {ONBOARDING_CARE_TAGS.map((tag) => (
            <ChoiceChip
              key={tag}
              height={chipHeight}
              selected={draft.careTags.includes(tag)}
              onPress={() => updateDraft(toggleCare(draft, tag))}
              label={t(`lesson.care.${tag}`)}
            />
          ))}
          <ChoiceChip
            height={chipHeight}
            selected={draft.noCare}
            onPress={() => updateDraft(toggleCare(draft, 'none'))}
            label={t('onboarding.care.none')}
          />
        </View>
      </View>
    </StepScreen>
  );
}

/** Lo que cambia en las clases por cada zona elegida. Sin zonas, una pista para empezar. */
function Adaptations({ zones, none }: { zones: readonly ZoneMarker[]; none: boolean }) {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  const layout = useOnboardingLayout();
  if (none) return null;
  if (zones.length === 0) {
    return (
      <Text
        variant="caption"
        color={palette.faint}
        style={{ marginTop: layout.gap, textAlign: 'center' }}
      >
        {t('onboarding.care.tapHint')}
      </Text>
    );
  }
  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      layout={LinearTransition.duration(240)}
      accessibilityLiveRegion="polite"
      style={{
        marginTop: layout.gap + 4,
        borderRadius: 20,
        backgroundColor: palette.card,
        padding: 14,
        gap: 8,
      }}
    >
      <Text weight="semibold" color={palette.ink} style={{ fontSize: 14, lineHeight: 18 }}>
        {t('onboarding.care.adaptTitle')}
      </Text>
      {zones.map((zone) => (
        <Animated.View
          key={zone}
          entering={FadeIn.duration(260)}
          exiting={FadeOut.duration(160)}
          layout={LinearTransition.duration(240)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
        >
          <View style={{ paddingTop: 2 }}>
            <CheckBadge size={16} />
          </View>
          <Text
            variant="caption"
            color={palette.ink}
            style={{ flexShrink: 1, fontSize: 14, lineHeight: 19 }}
          >
            {t(`onboarding.care.adapt.${zone}`)}
          </Text>
        </Animated.View>
      ))}
    </Animated.View>
  );
}
