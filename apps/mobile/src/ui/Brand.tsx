import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme/theme';

import { Text } from './Text';

const MANTA_PATH =
  'M60 14c10 0 16 8 22 12 12 4 26 4 36 8-14 4-30 8-44 14-6 3-10 6-12 10l-2 11-2-11c-2-4-6-7-12-10C32 42 16 38 2 34c10-4 24-4 36-8 6-4 12-12 22-12z';

/** La manta raya: se desliza despacio y con las alas abiertas, como el tai chi. */
export function MantaMark({ width = 30, color }: { width?: number; color?: string }) {
  const palette = useTheme();
  return (
    <Svg
      width={width}
      height={(width * 70) / 120}
      viewBox="0 0 120 70"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path d={MANTA_PATH} fill={color ?? palette.accent} />
    </Svg>
  );
}

export function Wordmark() {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
      accessible
      accessibilityRole="header"
      accessibilityLabel="Manta"
    >
      <MantaMark />
      <Text variant="headline" weight="semibold">
        Manta
      </Text>
    </View>
  );
}
