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

/**
 * Onboarding: blanco y negro puro, como una revista deportiva. El sol es el único color.
 * Sigue el modo de la app: claro → fondo blanco, cabina → fondo negro.
 */
export interface OnboardingPalette {
  scheme: 'light' | 'dark';
  background: string;
  ink: string;
  body: string;
  muted: string;
  line: string;
  iconOff: string;
  panel: string;
  /** Pista del anillo de minutos. */
  track: string;
  /** Sombra en el suelo bajo la figura. */
  shadow: string;
  shadowOpacity: number;
  accent: string;
  onAccent: string;
}

export const onboardingLight: OnboardingPalette = {
  scheme: 'light',
  background: '#FFFFFF',
  ink: '#0D0D0D',
  body: '#1F1F1F',
  muted: '#6B6B6B',
  line: '#D4D4D4',
  iconOff: '#BDBDBD',
  panel: '#F3F3F3',
  track: '#EFEFEF',
  shadow: '#000000',
  shadowOpacity: 0.18,
  accent: '#F2B134',
  onAccent: '#0D0D0D',
};

export const onboardingDark: OnboardingPalette = {
  scheme: 'dark',
  background: '#000000',
  ink: '#FFFFFF',
  body: '#E6E6E6',
  muted: '#9A9A9A',
  line: '#3A3A3A',
  iconOff: '#5A5A5A',
  panel: '#111111',
  track: '#1C1C1C',
  shadow: '#FFFFFF',
  shadowOpacity: 0.12,
  accent: '#F2B134',
  onAccent: '#000000',
};

/** La bienvenida va siempre sobre la imagen del amanecer. */
export const welcome = {
  ground: '#04191F',
  ink: '#FFFFFF',
  inkSoft: '#D6E4E7',
  separator: '#7F9CA3',
  sol: '#F2B134',
  onSol: '#04191F',
  glow: '#FFDC96',
  mist: '#F6DDB4',
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
  extrabold: 'Lexend_800ExtraBold',
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
