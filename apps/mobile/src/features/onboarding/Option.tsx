import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Press } from '@/ui/Press';

import { useOnboardingPalette } from './responsive';

export interface OptionColors {
  /** Texto: tinta si está elegida, gris si no. */
  text: string;
  /** Icono: el sol si está elegida. */
  icon: string;
  selected: boolean;
}

export interface OptionProps {
  selected: boolean;
  onPress: () => void;
  /** radio: una sola respuesta. checkbox: varias. */
  role: 'radio' | 'checkbox';
  accessibilityLabel: string;
  height: number;
  style?: StyleProp<ViewStyle>;
  children: (colors: OptionColors) => ReactNode;
}

/**
 * Botón de respuesta: rectángulo de esquinas rectas con borde fino.
 * Elegido: borde del color del sol y texto en tinta. Sin elegir: borde y texto grises.
 */
export function Option({
  selected,
  onPress,
  role,
  accessibilityLabel,
  height,
  style,
  children,
}: OptionProps) {
  const palette = useOnboardingPalette();
  return (
    <Press
      haptic
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: selected }}
      style={[
        {
          minHeight: height,
          borderWidth: 1.5,
          borderColor: selected ? palette.accent : palette.line,
          borderRadius: 0,
          overflow: 'hidden',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {children({
        text: selected ? palette.ink : palette.muted,
        icon: selected ? palette.accent : palette.iconOff,
        selected,
      })}
    </Press>
  );
}
