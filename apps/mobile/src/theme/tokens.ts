import type { TextStyle } from 'react-native';

/**
 * Tokens de diseño de Manta. Es el único lugar con colores, tamaños y fuentes:
 * los componentes de src/ui los leen de aquí.
 */

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

/**
 * Onboarding: blanco y negro puro, como una revista deportiva. El sol es el único color.
 * Siempre sobre fondo blanco, aunque el teléfono esté en modo oscuro.
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
  /** Mensajes de error (por ejemplo, al no poder entrar). */
  danger: string;
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
  danger: '#B3261E',
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
