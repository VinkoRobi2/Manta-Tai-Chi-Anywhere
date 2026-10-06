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
 * Onboarding: blanco, negro y el sol como único acento. Las opciones son tarjetas grises
 * que se vuelven negras al elegirlas. Siempre sobre fondo blanco, aunque el teléfono esté
 * en modo oscuro.
 */
export interface OnboardingPalette {
  scheme: 'light' | 'dark';
  background: string;
  ink: string;
  /** Texto secundario (contraste 4.5:1 o más sobre el fondo y sobre las tarjetas). */
  muted: string;
  /** Texto desactivado o de apoyo. */
  faint: string;
  /** Tarjetas y opciones sin elegir. */
  card: string;
  cardPressed: string;
  line: string;
  /** Pista de la barra de progreso y del anillo de minutos. */
  track: string;
  /** Opción elegida y botón principal. */
  selected: string;
  onSelected: string;
  onSelectedMuted: string;
  /** Casilla del icono dentro de una opción. */
  tile: string;
  tileSelected: string;
  /** Sombra en el suelo bajo la figura. */
  shadow: string;
  shadowOpacity: number;
  accent: string;
  onAccent: string;
  /** El sol como texto sobre una tarjeta elegida (negra). */
  accentOnSelected: string;
  /** Mensajes de error (por ejemplo, al no poder entrar). */
  danger: string;
}

export const onboardingLight: OnboardingPalette = {
  scheme: 'light',
  background: '#FFFFFF',
  ink: '#0A0A0A',
  muted: '#6B6B70',
  faint: '#A1A1A6',
  card: '#F4F4F6',
  cardPressed: '#EAEAEE',
  line: '#E5E5EA',
  track: '#ECECF0',
  selected: '#0A0A0A',
  onSelected: '#FFFFFF',
  onSelectedMuted: '#B4B4BA',
  tile: '#FFFFFF',
  tileSelected: '#262628',
  shadow: '#000000',
  shadowOpacity: 0.16,
  accent: '#F2B134',
  onAccent: '#0A0A0A',
  accentOnSelected: '#F2B134',
  danger: '#B3261E',
};

/**
 * La app después del onboarding (Inicio, Clases, Perfil): el mismo blanco y negro, con el sol como
 * único acento. Arriba blanco; debajo, una franja gris donde descansan las tarjetas.
 */
export interface AppPalette extends OnboardingPalette {
  /** Franja gris del cuerpo de Inicio. */
  band: string;
  /** Tarjetas blancas sobre la franja gris. */
  raised: string;
  /** Subidas en las estadísticas. Las bajadas van en gris: Manta no regaña. */
  positive: string;
}

export const appLight: AppPalette = {
  ...onboardingLight,
  band: '#F4F4F6',
  raised: '#FFFFFF',
  positive: '#16794A',
};

/** La ficha de cada clase: oscura, con la imagen grande arriba y un botón blanco. */
export const lessonDark = {
  ground: '#111113',
  hero: '#1C1C1F',
  silhouette: '#FFFFFF',
  ink: '#FFFFFF',
  muted: '#A8A8AE',
  faint: '#6E6E75',
  card: '#2A2A2E',
  /** Detrás del botón flotante. */
  scrim: 'rgba(17, 17, 19, 0.92)',
} as const;

/** La práctica guiada: el azul profundo de la bienvenida, para practicar sin distracciones. */
export const practiceDark = {
  ground: '#04191F',
  ink: '#FFFFFF',
  inkSoft: '#B9CDD2',
  faint: '#6F8C93',
  track: 'rgba(255, 255, 255, 0.16)',
  card: 'rgba(255, 255, 255, 0.08)',
  sol: '#F2B134',
  onSol: '#04191F',
} as const;

/** La bienvenida va siempre sobre el video. */
export const welcome = {
  ground: '#04191F',
  ink: '#FFFFFF',
  inkSoft: '#D6E4E7',
  separator: '#7F9CA3',
  sol: '#F2B134',
  onSol: '#04191F',
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
