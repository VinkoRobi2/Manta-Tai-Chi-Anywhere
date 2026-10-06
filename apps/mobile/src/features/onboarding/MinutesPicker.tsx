import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { DAILY_MINUTES, type DailyMinutes } from '@/features/settings/settings';
import { tapFeedback } from '@/lib/haptics';
import { fonts } from '@/theme/tokens';
import { Text } from '@/ui/Text';

import { RECOMMENDED_MINUTES } from './onboarding';
import { Ring } from './PoseArt';
import { useOnboardingLayout, useOnboardingPalette } from './responsive';

const LONGEST = DAILY_MINUTES[DAILY_MINUTES.length - 1];

/** El número grande dentro del anillo del sol: el anillo se llena con los minutos (20 = vuelta). */
export function MinutesDial({ minutes, size }: { minutes: DailyMinutes; size: number }) {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  return (
    <View
      style={{ width: size, height: size, alignSelf: 'center' }}
      accessible
      accessibilityLabel={t('onboarding.time.option', { count: minutes })}
    >
      <Ring
        size={size}
        stroke={Math.max(10, size * 0.05)}
        progress={minutes / LONGEST}
        track={palette.track}
        color={palette.accent}
      />
      <View
        style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.View key={minutes} entering={FadeIn.duration(220)}>
          <Text
            color={palette.ink}
            maxFontSizeMultiplier={1}
            style={{
              fontFamily: fonts.semibold,
              fontSize: size * 0.36,
              lineHeight: size * 0.42,
              letterSpacing: -size * 0.012,
              textAlign: 'center',
            }}
          >
            {minutes}
          </Text>
        </Animated.View>
        <Text
          color={palette.muted}
          maxFontSizeMultiplier={1.3}
          style={{ fontSize: size * 0.065, lineHeight: size * 0.085 }}
        >
          {t('onboarding.time.perDay')}
        </Text>
      </View>
    </View>
  );
}

/** Selector de 5 / 10 / 20 min: una píldora negra que se desliza bajo la opción elegida. */
export function MinutesSegmented({
  value,
  onChange,
}: {
  value: DailyMinutes;
  onChange: (minutes: DailyMinutes) => void;
}) {
  const { t } = useTranslation();
  const palette = useOnboardingPalette();
  const layout = useOnboardingLayout();
  const height = layout.breakpoint === 'tablet' ? 64 : layout.breakpoint === 'compact' ? 50 : 56;
  const pad = 4;
  const [width, setWidth] = useState(0);
  const segment = width > 0 ? (width - pad * 2) / DAILY_MINUTES.length : 0;
  const index = DAILY_MINUTES.indexOf(value);
  const offset = useSharedValue(index * segment);
  useEffect(() => {
    offset.value = withSpring(index * segment, { damping: 20, stiffness: 260, mass: 0.7 });
  }, [index, offset, segment]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          marginBottom: 10,
          paddingHorizontal: 10,
          height: 24,
          borderRadius: 12,
          backgroundColor: palette.accent,
          justifyContent: 'center',
        }}
      >
        <Text
          variant="caption"
          weight="semibold"
          color={palette.onAccent}
          style={{ fontSize: 12, lineHeight: 16 }}
        >
          {t('onboarding.time.recommended')}
        </Text>
      </View>
      <View
        accessibilityRole="radiogroup"
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        style={{
          alignSelf: 'stretch',
          height,
          borderRadius: height / 2,
          backgroundColor: palette.card,
          padding: pad,
          flexDirection: 'row',
        }}
      >
        {segment > 0 ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: pad,
                top: pad,
                width: segment,
                height: height - pad * 2,
                borderRadius: (height - pad * 2) / 2,
                backgroundColor: palette.selected,
              },
              indicator,
            ]}
          />
        ) : null}
        {DAILY_MINUTES.map((minutes) => {
          const selected = minutes === value;
          return (
            <Pressable
              key={minutes}
              accessibilityRole="radio"
              accessibilityLabel={`${t('onboarding.time.option', { count: minutes })}${
                minutes === RECOMMENDED_MINUTES ? `, ${t('onboarding.time.recommended')}` : ''
              }`}
              accessibilityState={{ checked: selected }}
              onPress={() => {
                tapFeedback();
                onChange(minutes);
              }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text
                weight="medium"
                color={selected ? palette.onSelected : palette.ink}
                style={{
                  fontSize: layout.labelSize,
                  lineHeight: Math.round(layout.labelSize * 1.2),
                }}
              >
                {minutes} {t('onboarding.time.unit')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
