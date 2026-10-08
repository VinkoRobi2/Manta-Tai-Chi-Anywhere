import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Squish } from '@/features/onboarding/Squish';
import { appLight, motion } from '@/theme/tokens';
import { Text } from '@/ui/Text';

export interface Segment<T extends string | number> {
  value: T;
  label: string;
  /** Un icono pequeño después del nombre (por ejemplo, el candado de Premium). */
  icon?: (color: string) => ReactNode;
}

/**
 * Control segmentado: una píldora gris con las opciones a partes iguales y una píldora negra
 * que se desliza hasta la elegida.
 */
export function Segmented<T extends string | number>({
  segments,
  value,
  onChange,
  height = 44,
}: {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  height?: number;
}) {
  const palette = appLight;
  const [width, setWidth] = useState(0);
  const pad = 4;
  const index = Math.max(
    0,
    segments.findIndex((segment) => segment.value === value),
  );
  const slot = width > 0 ? (width - pad * 2) / segments.length : 0;

  const thumb = useAnimatedStyle(() => ({
    opacity: slot > 0 ? 1 : 0,
    width: slot,
    transform: [
      {
        translateX: withTiming(index * slot, {
          duration: motion.quick,
          easing: Easing.out(Easing.cubic),
        }),
      },
    ],
  }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}
      style={{
        height,
        borderRadius: height / 2,
        padding: pad,
        flexDirection: 'row',
        backgroundColor: palette.card,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: pad,
            bottom: pad,
            left: pad,
            borderRadius: (height - pad * 2) / 2,
            backgroundColor: palette.selected,
          },
          thumb,
        ]}
      />
      {segments.map((segment) => {
        const selected = segment.value === value;
        const color = selected ? palette.onSelected : palette.ink;
        return (
          <Squish
            key={String(segment.value)}
            onPress={() => onChange(segment.value)}
            haptic={!selected}
            pressedScale={0.96}
            accessibilityRole="tab"
            accessibilityLabel={segment.label}
            accessibilityState={{ selected }}
            containerStyle={{ flex: 1 }}
            style={{
              height: height - pad * 2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              paddingHorizontal: 6,
            }}
          >
            <Text
              weight={selected ? 'semibold' : 'medium'}
              color={color}
              numberOfLines={1}
              maxFontSizeMultiplier={1.25}
              style={{ fontSize: 15, lineHeight: 19 }}
            >
              {segment.label}
            </Text>
            {segment.icon?.(selected ? palette.onSelectedMuted : palette.faint)}
          </Squish>
        );
      })}
    </View>
  );
}
