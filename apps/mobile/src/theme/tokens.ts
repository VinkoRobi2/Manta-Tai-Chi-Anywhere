import type { TextStyle } from 'react-native';

/**
 * Tokens de diseño de Manta. Es el único lugar con colores, tamaños y fuentes:
 * los componentes de src/ui los leen de aquí.
 */

export type Appearance = 'system' | 'light' | 'cabin';

export interface Palette {
  scheme: 'light' | 'dark';
  /** Fondo de pantalla. */
  background: string;
  /** Tarjetas y hojas. */
  surface: string;
  /** Superficie tonal (barras de Android, controles segmentados). */
  surfaceAlt: string;
  /** Relleno de elementos seleccionados en Android. */
  tonal: string;
  ink: string;
  inkSoft: string;
  accent: string;
  border: string;
  sol: string;
  onSol: string;
  onAccent: string;
  scrim: string;
  danger: string;
}

export const light: Palette = {
  scheme: 'light',
  background: '#EEF4F5',
  surface: '#FFFFFF',
  surfaceAlt: '#DCE9EC',
  tonal: '#B7DCE3',
  ink: '#0B3C49',
  inkSoft: '#4A6D76',
  accent: '#1F7A8C',
  border: '#C9D9DD',
  sol: '#F2B134',
  onSol: '#0B3C49',
  onAccent: '#FFFFFF',
  scrim: 'rgba(6, 35, 43, 0.45)',
  danger: '#A23B2A',
};

/** Modo cabina: para practicar de noche en un camarote sin encandilarse. */
export const cabin: Palette = {
  scheme: 'dark',
  background: '#06232B',
  surface: '#0B3C49',
  surfaceAlt: '#103F4B',
  tonal: '#1F5A68',
  ink: '#EEF4F5',
  inkSoft: '#A9C1C7',
  accent: '#6CC0D0',
  border: '#1D5361',
  sol: '#E0A52F',
  onSol: '#0B3C49',
  onAccent: '#06232B',
  scrim: 'rgba(0, 0, 0, 0.55)',
  danger: '#E8907E',
};

/** El escenario del reproductor siempre es oscuro, en cualquier modo. */
export const stage = {
  top: '#145466',
  middle: '#0B3C49',
  bottom: '#06232B',
  ink: '#EEF4F5',
  inkSoft: '#9DB4BA',
  water: 'rgba(31, 122, 140, 0.42)',
  foam: 'rgba(242, 177, 52, 0.85)',
  control: 'rgba(238, 244, 245, 0.12)',
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48, gutter: 20 } as const;

export const radius = { chip: 12, card: 20, sheet: 28, pill: 999 } as const;

/** Área táctil mínima. */
export const TOUCH = 56;

export const fonts = {
  light: 'Lexend_300Light',
  regular: 'Lexend_400Regular',
  medium: 'Lexend_500Medium',
  semibold: 'Lexend_600SemiBold',
} as const;

export type FontWeight = keyof typeof fonts;

export interface TypeStyle {
  size: number;
  lineHeight: number;
  weight: FontWeight;
  letterSpacing?: number;
  transform?: TextStyle['textTransform'];
}

export const typeScale = {
  display: { size: 34, lineHeight: 40, weight: 'semibold', letterSpacing: -0.4 },
  title: { size: 26, lineHeight: 32, weight: 'semibold', letterSpacing: -0.2 },
  headline: { size: 21, lineHeight: 28, weight: 'medium' },
  body: { size: 18, lineHeight: 27, weight: 'regular' },
  callout: { size: 16, lineHeight: 22, weight: 'regular' },
  caption: { size: 14, lineHeight: 19, weight: 'regular' },
  label: { size: 13, lineHeight: 16, weight: 'medium', letterSpacing: 0.8, transform: 'uppercase' },
} satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof typeScale;

/** Movimiento como una respiración: sin rebotes. */
export const motion = { quick: 240, calm: 480, breath: 800 } as const;
