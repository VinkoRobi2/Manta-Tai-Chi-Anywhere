import { Platform, View } from 'react-native';

import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import { Icon } from './Icon';
import { Press } from './Press';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Chip seleccionable. iOS: cápsula. Android: chip de filtro Material con check. */
export function Chip({ label, selected, onPress }: ChipProps) {
  const palette = useTheme();
  const android = Platform.OS === 'android';
  const background = selected
    ? android
      ? palette.tonal
      : palette.ink
    : android
      ? 'transparent'
      : palette.surface;
  const foreground = selected && !android ? palette.background : palette.ink;

  return (
    <Press
      haptic
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={{
        minHeight: 44,
        paddingHorizontal: space.l,
        borderRadius: android ? 10 : 22,
        borderWidth: 1,
        borderColor: selected ? background : android ? palette.inkSoft : palette.border,
        backgroundColor: background,
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {selected ? <Icon name="check" size={16} color={foreground} /> : null}
        <Text variant="callout" weight="medium" color={foreground}>
          {label}
        </Text>
      </View>
    </Press>
  );
}
