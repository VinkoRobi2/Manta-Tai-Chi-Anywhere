import {
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { tapFeedback } from '@/lib/haptics';
import { useTheme } from '@/theme/theme';

export interface PressProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Toque háptico suave al presionar. */
  haptic?: boolean;
}

/**
 * Todo lo que se toca. Android: ripple de Material. iOS y web: baja la opacidad.
 * Para que el ripple respete las esquinas, el estilo debe llevar overflow: 'hidden'.
 */
export function Press({
  style,
  haptic = false,
  onPress,
  accessibilityRole = 'button',
  ...rest
}: PressProps) {
  const palette = useTheme();
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      android_ripple={{
        color: palette.scheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(11,60,73,0.12)',
      }}
      style={({ pressed }) => [
        style,
        Platform.OS !== 'android' && pressed ? { opacity: 0.55 } : null,
      ]}
      onPress={(event) => {
        if (haptic) tapFeedback();
        onPress?.(event);
      }}
      {...rest}
    />
  );
}
