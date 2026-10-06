import type { ReactNode } from 'react';
import {
  Pressable,
  type AccessibilityRole,
  type AccessibilityState,
  type Insets,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { tapFeedback } from '@/lib/haptics';

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 } as const;

export interface SquishProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Vibración suave al tocar. */
  haptic?: boolean;
  /** Cuánto se encoge al presionar. */
  pressedScale?: number;
  /** Estilo del contenedor que se anima (tamaño, flex, márgenes). */
  containerStyle?: StyleProp<ViewStyle>;
  /** Estilo del área táctil (fondo, bordes, relleno). */
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  hitSlop?: number | Insets;
}

/**
 * Todo lo que se toca en el onboarding: se encoge un poco con un resorte al presionar,
 * como en iOS. Con "Reducir movimiento" no se anima.
 */
export function Squish({
  children,
  onPress,
  disabled = false,
  haptic = true,
  pressedScale = 0.97,
  containerStyle,
  style,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  hitSlop,
}: SquishProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[containerStyle, animated]}>
      <Pressable
        disabled={disabled}
        hitSlop={hitSlop}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled, ...accessibilityState }}
        onPressIn={() => {
          if (!reducedMotion) scale.set(withSpring(pressedScale, SPRING));
        }}
        onPressOut={() => {
          scale.set(withSpring(1, SPRING));
        }}
        onPress={() => {
          if (haptic) tapFeedback();
          onPress?.();
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
