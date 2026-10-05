import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import {
  bodyScale,
  isDisplay,
  type FontWeight,
  type Palette,
  type TypeVariant,
} from '@/theme/tokens';

export type Tone = 'ink' | 'soft' | 'accent' | 'secondary' | 'onPrimary' | 'danger';

function toneColor(palette: Palette, tone: Tone): string {
  switch (tone) {
    case 'soft':
      return palette.inkSoft;
    case 'accent':
      return palette.accent;
    case 'secondary':
      return palette.secondary;
    case 'onPrimary':
      return palette.onPrimary;
    case 'danger':
      return palette.danger;
    default:
      return palette.ink;
  }
}

function fontFor(
  palette: Palette,
  variant: TypeVariant,
  weight: FontWeight | undefined,
  italic: boolean,
): string {
  if (isDisplay(variant)) {
    if (italic) return palette.fonts.display.italic;
    return weight === 'regular' || weight === 'light' || weight === 'medium'
      ? palette.fonts.display.regular
      : palette.fonts.display.semibold;
  }
  const body = palette.fonts.body;
  switch (weight ?? (variant === 'label' ? 'bold' : 'regular')) {
    case 'medium':
      return body.medium;
    case 'semibold':
      return body.semibold;
    case 'bold':
      return body.bold;
    default:
      return body.regular;
  }
}

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  tone?: Tone;
  weight?: FontWeight;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
}

/**
 * Todo texto de la app pasa por aquí. Los títulos usan la tipografía del mundo activo
 * (Cormorant en Tinta, Sora en Abisal); el texto de lectura, Atkinson Hyperlegible Next.
 */
export function Text({
  variant = 'body',
  tone = 'ink',
  weight,
  italic = false,
  align,
  color,
  style,
  ...rest
}: TextProps) {
  const palette = useTheme();
  const scale: {
    size: number;
    lineHeight: number;
    letterSpacing?: number;
    transform?: TextStyle['textTransform'];
  } = isDisplay(variant) ? palette.displayScale[variant] : bodyScale[variant];
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fontFor(palette, variant, weight, italic),
          fontSize: scale.size,
          lineHeight: scale.lineHeight,
          letterSpacing: scale.letterSpacing,
          textTransform: scale.transform,
          color: color ?? toneColor(palette, tone),
          textAlign: align,
          fontStyle: italic && !isDisplay(variant) ? 'italic' : undefined,
          // Cormorant usa cifras antiguas por defecto: en la app los números van alineados.
          fontVariant: isDisplay(variant) ? ['lining-nums'] : undefined,
        },
        style,
      ]}
    />
  );
}
