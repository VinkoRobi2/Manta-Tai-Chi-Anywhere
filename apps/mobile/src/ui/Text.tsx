import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/theme/theme';
import {
  fonts,
  stage,
  typeScale,
  type FontWeight,
  type Palette,
  type TypeVariant,
} from '@/theme/tokens';

export type Tone =
  'ink' | 'soft' | 'accent' | 'onSol' | 'onAccent' | 'stage' | 'stageSoft' | 'danger';

function toneColor(palette: Palette, tone: Tone): string {
  switch (tone) {
    case 'soft':
      return palette.inkSoft;
    case 'accent':
      return palette.accent;
    case 'onSol':
      return palette.onSol;
    case 'onAccent':
      return palette.onAccent;
    case 'stage':
      return stage.ink;
    case 'stageSoft':
      return stage.inkSoft;
    case 'danger':
      return palette.danger;
    default:
      return palette.ink;
  }
}

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  tone?: Tone;
  weight?: FontWeight;
  align?: 'left' | 'center' | 'right';
  color?: string;
}

/** Todo texto de la app pasa por aquí: Lexend, escala tipográfica y color del tema. */
export function Text({
  variant = 'body',
  tone = 'ink',
  weight,
  align,
  color,
  style,
  ...rest
}: TextProps) {
  const palette = useTheme();
  const type = typeScale[variant];
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fonts[weight ?? type.weight],
          fontSize: type.size,
          lineHeight: type.lineHeight,
          letterSpacing: 'letterSpacing' in type ? type.letterSpacing : undefined,
          textTransform: 'transform' in type ? type.transform : undefined,
          color: color ?? toneColor(palette, tone),
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
