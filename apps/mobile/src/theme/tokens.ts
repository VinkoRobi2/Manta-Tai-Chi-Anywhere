import { Platform, type TextStyle } from 'react-native';

/**
 * Tokens de diseño de Manta. Es el único lugar con colores, tamaños y fuentes:
 * los componentes de src/ui los leen de aquí.
 *
 * Dos mundos:
 * - Tinta (día): tinta sobre papel, como la pintura china. Bermellón para lo importante.
 * - Abisal (noche, "modo cabina"): el mar de noche con plancton que brilla.
 */

export type Appearance = 'system' | 'light' | 'cabin';
export type ThemeName = 'tinta' | 'abisal';
export type FontWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

export interface Palette {
  name: ThemeName;
  scheme: 'light' | 'dark';
  /** Fondo de pantalla. */
  background: string;
  /** Hojas y paneles. */
  surface: string;
  /** Superficies secundarias: pistas, controles segmentados. */
  surfaceAlt: string;
  /** Relleno de lo seleccionado. */
  tonal: string;
  ink: string;
  inkSoft: string;
  /** Tinta: bermellón. Abisal: cian luminoso. */
  accent: string;
  /** "Anclada" y estados tranquilos. */
  secondary: string;
  border: string;
  /** Botón principal. */
  primary: string;
  onPrimary: string;
  /** Color del brillo en Abisal; null en Tinta (la tinta no brilla). */
  glow: string | null;
  scrim: string;
  danger: string;
  /** Fondo del reproductor: de arriba hacia abajo. */
  stage: { top: string; middle: string; bottom: string };
  fonts: {
    display: { regular: string; semibold: string; italic: string };
    body: { regular: string; medium: string; semibold: string; bold: string };
  };
  /** Tamaños de los títulos: cada tipografía de títulos pide su propia escala. */
  displayScale: Record<'display' | 'title' | 'headline', TypeStyle>;
}

export interface TypeStyle {
  size: number;
  lineHeight: number;
  letterSpacing?: number;
}

export const tinta: Palette = {
  name: 'tinta',
  scheme: 'light',
  background: '#F3F3EF',
  surface: '#FAFAF7',
  surfaceAlt: '#E6E6E0',
  tonal: '#E3E3DE',
  ink: '#17191B',
  inkSoft: '#55595D',
  accent: '#B8321F',
  secondary: '#2C4A5A',
  border: '#CFCFC8',
  primary: '#B8321F',
  onPrimary: '#F7F4EE',
  glow: null,
  scrim: 'rgba(23, 25, 27, 0.4)',
  danger: '#8E2A1A',
  stage: { top: '#F3F3EF', middle: '#F3F3EF', bottom: '#ECECE6' },
  fonts: {
    display: {
      regular: 'CormorantGaramond_500Medium',
      semibold: 'CormorantGaramond_600SemiBold',
      italic: 'CormorantGaramond_500Medium_Italic',
    },
    body: {
      regular: 'AtkinsonHyperlegibleNext_400Regular',
      medium: 'AtkinsonHyperlegibleNext_500Medium',
      semibold: 'AtkinsonHyperlegibleNext_600SemiBold',
      bold: 'AtkinsonHyperlegibleNext_700Bold',
    },
  },
  // Cormorant tiene letras bajas pequeñas: necesita más tamaño para leerse igual.
  displayScale: {
    display: { size: 42, lineHeight: 44, letterSpacing: -0.4 },
    title: { size: 31, lineHeight: 34, letterSpacing: -0.2 },
    headline: { size: 25, lineHeight: 28 },
  },
};

export const abisal: Palette = {
  name: 'abisal',
  scheme: 'dark',
  background: '#05121D',
  surface: '#0C2433',
  surfaceAlt: '#12303F',
  tonal: '#14404F',
  ink: '#E6F6F7',
  inkSoft: '#93B4BE',
  accent: '#5FE3E8',
  secondary: '#8BF5C8',
  border: '#1F4354',
  primary: '#8BF5C8',
  onPrimary: '#04222A',
  glow: '#5FE3E8',
  scrim: 'rgba(0, 0, 0, 0.6)',
  danger: '#FF9C8A',
  stage: { top: '#0B3346', middle: '#061623', bottom: '#030C14' },
  fonts: {
    display: { regular: 'Sora_500Medium', semibold: 'Sora_600SemiBold', italic: 'Sora_500Medium' },
    body: {
      regular: 'AtkinsonHyperlegibleNext_400Regular',
      medium: 'AtkinsonHyperlegibleNext_500Medium',
      semibold: 'AtkinsonHyperlegibleNext_600SemiBold',
      bold: 'AtkinsonHyperlegibleNext_700Bold',
    },
  },
  displayScale: {
    display: { size: 34, lineHeight: 40, letterSpacing: -0.8 },
    title: { size: 26, lineHeight: 32, letterSpacing: -0.4 },
    headline: { size: 20, lineHeight: 26, letterSpacing: -0.2 },
  },
};

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48, gutter: 24 } as const;

export const radius = { chip: 12, card: 24, sheet: 28, pill: 999 } as const;

/** Área táctil mínima. */
export const TOUCH = 56;

/** Texto de lectura (Atkinson Hyperlegible Next, hecha para baja visión). */
export const bodyScale = {
  body: { size: 18, lineHeight: 27 },
  callout: { size: 16, lineHeight: 22 },
  caption: { size: 14, lineHeight: 19 },
  label: {
    size: 13,
    lineHeight: 16,
    letterSpacing: 1.4,
    transform: 'uppercase' as TextStyle['textTransform'],
  },
};

export type DisplayVariant = 'display' | 'title' | 'headline';
export type BodyVariant = keyof typeof bodyScale;
export type TypeVariant = DisplayVariant | BodyVariant;

export const isDisplay = (variant: TypeVariant): variant is DisplayVariant =>
  variant === 'display' || variant === 'title' || variant === 'headline';

/** Movimiento como una respiración: sin rebotes. */
export const motion = { quick: 240, calm: 480, breath: 800 } as const;

/**
 * Brillo alrededor del CONTENIDO de una vista sin fondo (un ícono, la manta).
 * Solo iOS lo dibuja siguiendo la forma; en Android y web saldría una caja, así que no se aplica.
 */
export function contentGlow(palette: Palette, strength = 0.6) {
  return Platform.OS === 'ios' ? glowShadow(palette, strength) : null;
}

/** Sombra luminosa de Abisal para vistas con fondo (botones, paneles). En Tinta no hay brillo. */
export function glowShadow(palette: Palette, strength = 0.5) {
  if (!palette.glow) return null;
  return {
    shadowColor: palette.glow,
    shadowOpacity: strength,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  } as const;
}
