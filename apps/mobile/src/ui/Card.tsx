import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import { glowShadow, radius, space } from '@/theme/tokens';

import { Press } from './Press';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  /** Abisal: brilla un poco más (por ejemplo, la próxima clase). */
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Un panel. En Tinta es papel apenas más claro con un filete fino, sin sombra.
 * En Abisal es vidrio oscuro con borde luminoso.
 */
export function useCardStyle(highlighted = false): ViewStyle {
  const palette = useTheme();
  if (palette.name === 'abisal') {
    return {
      backgroundColor: highlighted ? '#0F3242' : palette.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: highlighted ? 'rgba(95,227,232,0.45)' : palette.border,
      ...(highlighted ? glowShadow(palette, 0.35) : null),
    };
  }
  return {
    backgroundColor: palette.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.border,
  };
}

export function Card({
  onPress,
  padded = true,
  highlighted = false,
  style,
  children,
  accessibilityLabel,
  ...rest
}: CardProps) {
  const base = useCardStyle(highlighted);
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

/** Filete horizontal: en Tinta separa secciones como en un libro. */
export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  const palette = useTheme();
  return <View style={[{ height: 1, backgroundColor: palette.border }, style]} />;
}
