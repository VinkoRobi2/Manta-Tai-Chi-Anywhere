import { View } from 'react-native';

import { useTheme } from '@/theme/theme';
import { glowShadow, space } from '@/theme/tokens';

import { Icon } from './Icon';
import { Press } from './Press';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Tinta: filete fino; elegido, tinta llena. Abisal: vidrio; elegido, borde luminoso. */
export function Chip({ label, selected, onPress }: ChipProps) {
  const palette = useTheme();
  const night = palette.name === 'abisal';
  const background = selected
    ? night
      ? 'rgba(95,227,232,0.14)'
      : palette.ink
    : night
      ? palette.surface
      : 'transparent';
  const foreground = selected && !night ? palette.background : palette.ink;
  const border = selected ? (night ? palette.accent : palette.ink) : palette.border;

  return (
    <Press
      haptic
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={[
        {
          minHeight: 44,
          paddingHorizontal: space.l,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: background,
          justifyContent: 'center',
          overflow: 'hidden',
        },
        selected ? glowShadow(palette, 0.35) : null,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {selected ? (
          <Icon name="check" size={15} color={night ? palette.accent : foreground} />
        ) : null}
        <Text variant="callout" weight={selected ? 'bold' : 'medium'} color={foreground}>
          {label}
        </Text>
      </View>
    </Press>
  );
}
