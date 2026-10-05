import { Platform, View } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Icon } from './Icon';
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

/** iOS: control segmentado clásico. Android: botones segmentados de Material 3 con check. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  const palette = useTheme();
  const android = Platform.OS === 'android';

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={
        android
          ? {
              flexDirection: 'row',
              borderWidth: 1,
              borderColor: palette.inkSoft,
              borderRadius: 24,
              overflow: 'hidden',
            }
          : {
              flexDirection: 'row',
              backgroundColor: palette.surfaceAlt,
              borderRadius: 12,
              padding: 3,
            }
      }
    >
      {options.map((option, index) => {
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
              minHeight: android ? 48 : 42,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
              overflow: 'hidden',
              ...(android
                ? {
                    backgroundColor: selected ? palette.tonal : 'transparent',
                    borderLeftWidth: index === 0 ? 0 : 1,
                    borderLeftColor: palette.inkSoft,
                  }
                : {
                    borderRadius: 9,
                    backgroundColor: selected ? palette.surface : 'transparent',
                    shadowColor: '#0B3C49',
                    shadowOpacity: selected ? 0.12 : 0,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                  }),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {android && selected ? <Icon name="check" size={16} /> : null}
              <Text
                variant="caption"
                weight={selected ? 'semibold' : 'medium'}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {option.label}
              </Text>
            </View>
          </Press>
        );
      })}
    </View>
  );
}
