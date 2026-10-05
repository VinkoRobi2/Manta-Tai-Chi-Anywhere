import { Platform, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

import { Press } from './Press';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Superficie separada del fondo. iOS (modo claro): sombra suave.
 * Android y modo cabina: borde fino, como en Material 3.
 */
export function useCardStyle(): ViewStyle {
  const palette = useTheme();
  const shadow = Platform.OS === 'ios' && palette.scheme === 'light';
  return {
    backgroundColor: palette.surface,
    borderRadius: Platform.OS === 'android' ? 16 : radius.card,
    ...(shadow
      ? {
          shadowColor: '#0B3C49',
          shadowOpacity: 0.1,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
        }
      : { borderWidth: 1, borderColor: palette.border }),
  };
}

export function Card({
  onPress,
  padded = true,
  style,
  children,
  accessibilityLabel,
  ...rest
}: CardProps) {
  const base = useCardStyle();
  const merged = [base, padded ? { padding: space.l } : null, style];
  if (onPress) {
    return (
      <Press
        haptic
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        style={[merged, { overflow: 'hidden' }]}
      >
        {children}
      </Press>
    );
  }
  return (
    <View style={merged} accessibilityLabel={accessibilityLabel} {...rest}>
      {children}
    </View>
  );
}
