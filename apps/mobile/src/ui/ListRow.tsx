import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/theme';
import { space, TOUCH } from '@/theme/tokens';

import { Press } from './Press';
import { Text } from './Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  divider?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function ListRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  divider = false,
  accessibilityLabel,
  accessibilityHint,
}: ListRowProps) {
  const palette = useTheme();
  const content = (
    <View
      style={{
        minHeight: TOUCH + 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.m,
        paddingVertical: space.m,
        borderTopWidth: divider ? 1 : 0,
        borderTopColor: palette.border,
      }}
    >
      {left}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="callout" weight="medium">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="soft">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return content;
  return (
    <Press
      haptic
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      style={{ overflow: 'hidden' }}
    >
      {content}
    </Press>
  );
}
