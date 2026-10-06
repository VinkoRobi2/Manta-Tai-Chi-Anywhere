import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/ui/Text';

import { useOnboardingLayout, useOnboardingPalette } from './responsive';
import { Squish } from './Squish';

export interface ContinueButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Algo antes del texto (por ejemplo, el triángulo de "play"). */
  icon?: ReactNode;
  accessibilityHint?: string;
}

/**
 * El botón principal, fijo abajo: una píldora negra a todo el ancho (blanca en modo cabina).
 * Desactivado se ve gris hasta que hay una respuesta.
 */
export function ContinueButton({
  label,
  onPress,
  disabled = false,
  icon,
  accessibilityHint,
}: ContinueButtonProps) {
  const palette = useOnboardingPalette();
  const layout = useOnboardingLayout();
  const enabled = useSharedValue(disabled ? 0 : 1);
  useEffect(() => {
    enabled.value = withTiming(disabled ? 0 : 1, { duration: 220 });
  }, [disabled, enabled]);
  const background = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(enabled.value, [0, 1], [palette.card, palette.selected]),
  }));

  return (
    <Squish
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      pressedScale={0.98}
    >
      <Animated.View
        style={[
          {
            height: layout.buttonHeight,
            borderRadius: layout.buttonHeight / 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingHorizontal: 24,
          },
          background,
        ]}
      >
        {icon ? <View>{icon}</View> : null}
        <Text
          weight="semibold"
          color={disabled ? palette.faint : palette.onSelected}
          maxFontSizeMultiplier={1.4}
          style={{
            fontSize: layout.breakpoint === 'tablet' ? 19 : 17,
            lineHeight: 22,
            letterSpacing: -0.1,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Squish>
  );
}

/** Botón de texto, discreto, para acciones secundarias. */
export function TextButton({
  label,
  onPress,
  color,
}: {
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const palette = useOnboardingPalette();
  return (
    <Squish
      onPress={onPress}
      haptic={false}
      accessibilityLabel={label}
      containerStyle={{ alignSelf: 'center' }}
      style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 }}
    >
      <Text weight="medium" color={color ?? palette.ink} style={{ fontSize: 15, lineHeight: 20 }}>
        {label}
      </Text>
    </Squish>
  );
}
