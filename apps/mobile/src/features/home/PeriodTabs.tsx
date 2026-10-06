import { STAT_PERIODS, type StatPeriod } from '@manta/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Squish } from '@/features/onboarding/Squish';
import { appLight, motion } from '@/theme/tokens';
import { Text } from '@/ui/Text';

interface Slot {
  x: number;
  width: number;
}

/** 7, 30 o 90 días: la raya negra se desliza bajo el periodo elegido. */
export function PeriodTabs({
  value,
  onChange,
}: {
  value: StatPeriod;
  onChange: (period: StatPeriod) => void;
}) {
  const { t } = useTranslation();
  const palette = appLight;
  const [slots, setSlots] = useState<Partial<Record<StatPeriod, Slot>>>({});
  const active = slots[value];

  const underline = useAnimatedStyle(() => ({
    opacity: active ? 1 : 0,
    width: withTiming(active?.width ?? 0, { duration: motion.quick }),
    transform: [{ translateX: withTiming(active?.x ?? 0, { duration: motion.quick }) }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      style={{ borderBottomWidth: 1, borderBottomColor: palette.line }}
    >
      <View style={{ flexDirection: 'row', gap: 28 }}>
        {STAT_PERIODS.map((period) => {
          const selected = period === value;
          const label = t('home.period', { count: period });
          return (
            <View
              key={period}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                setSlots((current) => ({ ...current, [period]: { x, width } }));
              }}
            >
              <Squish
                onPress={() => onChange(period)}
                haptic={!selected}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                style={{ height: 48, justifyContent: 'center' }}
              >
                <Text
                  weight={selected ? 'semibold' : 'regular'}
                  color={selected ? palette.ink : palette.muted}
                  style={{ fontSize: 17, lineHeight: 22 }}
                >
                  {label}
                </Text>
              </Squish>
            </View>
          );
        })}
      </View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: -1,
            left: 0,
            height: 3,
            borderRadius: 2,
            backgroundColor: palette.ink,
          },
          underline,
        ]}
      />
    </View>
  );
}
