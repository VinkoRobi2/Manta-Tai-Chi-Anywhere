import { View } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Press } from './Press';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/**
 * Tinta: opciones de texto sobre un filete; la elegida se subraya en bermellón.
 * Abisal: cápsula de vidrio; la elegida se ilumina.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  const palette = useTheme();
  const night = palette.name === 'abisal';

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={
        night
          ? {
              flexDirection: 'row',
              backgroundColor: palette.surface,
              borderRadius: 26,
              borderWidth: 1,
              borderColor: palette.border,
              padding: 4,
            }
          : { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: palette.border }
      }
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Press
            key={option.value}
            haptic
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={{
              flex: 1,
              minHeight: 46,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
              overflow: 'hidden',
              ...(night
                ? {
                    borderRadius: 22,
                    backgroundColor: selected ? 'rgba(95,227,232,0.16)' : 'transparent',
                  }
                : {
                    borderBottomWidth: 2,
                    borderBottomColor: selected ? palette.accent : 'transparent',
                    marginBottom: -1,
                  }),
            }}
          >
            <Text
              variant="callout"
              weight={selected ? 'bold' : 'regular'}
              color={selected ? (night ? palette.accent : palette.ink) : palette.inkSoft}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {option.label}
            </Text>
          </Press>
        );
      })}
    </View>
  );
}
