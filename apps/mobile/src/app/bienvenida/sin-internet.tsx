import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { programsForMode } from '@/features/catalog/catalog';
import { CheckBadge, ChoiceCard, IconTile } from '@/features/onboarding/ChoiceCard';
import {
  canContinue,
  DEFAULT_PRACTICE,
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
import type { OfflineUsage, PracticeMode } from '@/features/settings/settings';
import { useLocale } from '@/lib/i18n';
import { Text } from '@/ui/Text';

const USAGES: readonly OfflineUsage[] = ['often', 'sometimes', 'rarely'];

/** Paso 5: ¿sin internet? Con "A menudo" o "A veces" las clases gratis se descargan solas con Wi-Fi. */
export default function OfflineStep() {
  const { t } = useTranslation();
  const draft = useOnboardingDraft();
  const layout = useOnboardingLayout();
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
          <OfflinePreview
            key={wantsAutoAnchor(draft.offlineUsage) ? 'auto' : 'manual'}
            auto={wantsAutoAnchor(draft.offlineUsage)}
            mode={draft.practiceMode ?? DEFAULT_PRACTICE}
          />
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

/**
 * Lo que va a pasar, en pequeño: tus tres primeras clases bajando al teléfono una tras otra
 * (o, si casi nunca te quedas sin señal, esperando en la nube hasta que las abras).
 */
function OfflinePreview({ auto, mode }: { auto: boolean; mode: PracticeMode }) {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  const layout = useOnboardingLayout();
  const locale = useLocale();
  const lessons = programsForMode(locale, mode)[0]?.lessons.slice(0, 3) ?? [];

  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      accessibilityLiveRegion="polite"
      style={{
        marginTop: layout.gap + 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 14,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: palette.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Float amplitude={2} periodMs={1400} active={auto}>
            <DownloadGlyph color={palette.onAccent} size={16} />
          </Float>
        </View>
        <Text variant="caption" color={palette.ink} style={{ flexShrink: 1, fontSize: 14 }}>
          {t(auto ? 'onboarding.offline.auto' : 'onboarding.offline.manual')}
        </Text>
      </View>
      {lessons.map((lesson, index) => (
        <View key={lesson.slug} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              backgroundColor: palette.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text weight="semibold" color={palette.muted} style={{ fontSize: 13, lineHeight: 16 }}>
              {lesson.number}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text
              weight="medium"
              color={palette.ink}
              numberOfLines={1}
              style={{ fontSize: 14, lineHeight: 18 }}
            >
              {lesson.title}
            </Text>
            {auto ? <SaveBar delay={300 + index * 700} /> : null}
          </View>
          {auto ? (
            <SavedTag delay={300 + index * 700 + 900} label={t('onboarding.offline.saved')} />
          ) : (
            <Text variant="caption" color={palette.muted} style={{ fontSize: 12 }}>
              {t('onboarding.offline.cloud')}
            </Text>
          )}
        </View>
      ))}
    </Animated.View>
  );
}

/** La barrita que se llena mientras la clase baja al teléfono. */
function SaveBar({ delay }: { delay: number }) {
  const palette = useOnboardingPalette();
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const filled = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    filled.value = withDelay(
      delay,
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
    );
  }, [delay, filled, reducedMotion]);
  const style = useAnimatedStyle(() => ({ width: width * filled.value }));
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height: 4, borderRadius: 2, backgroundColor: palette.track, overflow: 'hidden' }}
    >
      <Animated.View
        style={[{ height: 4, borderRadius: 2, backgroundColor: palette.accent }, style]}
      />
    </View>
  );
}

/** "En el teléfono", con el visto, cuando la barrita termina. */
function SavedTag({ delay, label }: { delay: number; label: string }) {
  const palette = useOnboardingPalette();
  return (
    <Animated.View
      entering={ZoomIn.springify().damping(14).delay(delay)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
    >
      <CheckBadge size={16} />
      <Text variant="caption" weight="medium" color={palette.ink} style={{ fontSize: 12 }}>
        {label}
      </Text>
    </Animated.View>
  );
}
