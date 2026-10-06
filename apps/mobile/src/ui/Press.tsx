import { useState } from 'react';
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
 *
 * El estilo se pasa fijo (no como función de `pressed`): NativeWind, en el teléfono,
 * descarta los estilos dados como función y todo quedaba sin fondo ni bordes.
 */
export function Press({
  style,
  haptic = false,
  onPress,
  onPressIn,
  onPressOut,
  accessibilityRole = 'button',
  ...rest
}: PressProps) {
  const palette = useTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      android_ripple={{
        color: palette.scheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(11,60,73,0.12)',
      }}
      style={[style, Platform.OS !== 'android' && pressed ? { opacity: 0.55 } : null]}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic) tapFeedback();
        onPress?.(event);
      }}
      {...rest}
    />
  );
}
