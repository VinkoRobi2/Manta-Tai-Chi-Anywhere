import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { onboardingLight, type OnboardingPalette } from '@/theme/tokens';

/**
 * Las "media queries" del onboarding. React Native no tiene CSS, así que los cortes se calculan
 * con el tamaño real de la ventana (useWindowDimensions), que cambia al girar el teléfono,
 * al abrir un plegable o en pantalla dividida en iPad y Android.
 *
 * - compact: teléfonos bajos (iPhone SE, Android de 640 dp de alto).
 * - regular: la mayoría de los teléfonos.
 * - tablet: el lado corto mide 600 dp o más (iPad, tablets Android, plegables abiertos).
 * - wide: además, si la ventana es apaisada y ancha, el contenido se reparte en dos columnas.
 */
export type Breakpoint = 'compact' | 'regular' | 'tablet';

export interface OnboardingLayout {
  breakpoint: Breakpoint;
  wide: boolean;
  width: number;
  height: number;
  /** Ancho máximo del contenido. */
  contentWidth: number;
  gutter: number;
  /** Aire entre la barra superior y el título. */
  topPad: number;
  titleSize: number;
  titleLine: number;
  bodySize: number;
  bodyLine: number;
  labelSize: number;
  /** Alto mínimo de una opción en lista. */
  rowHeight: number;
  gap: number;
  /** Separación entre el texto y las opciones. */
  sectionGap: number;
  /** Alto máximo de la figura grande. */
  artMax: number;
  buttonHeight: number;
}

const BASE: Record<
  Breakpoint,
  Omit<OnboardingLayout, 'breakpoint' | 'wide' | 'width' | 'height'>
> = {
  compact: {
    contentWidth: 520,
    gutter: 20,
    topPad: 12,
    titleSize: 26,
    titleLine: 31,
    bodySize: 15,
    bodyLine: 21,
    labelSize: 16,
    rowHeight: 60,
    gap: 10,
    sectionGap: 20,
    artMax: 190,
    buttonHeight: 54,
  },
  regular: {
    contentWidth: 520,
    gutter: 24,
    topPad: 20,
    titleSize: 31,
    titleLine: 37,
    bodySize: 16,
    bodyLine: 23,
    labelSize: 17,
    rowHeight: 68,
    gap: 12,
    sectionGap: 28,
    artMax: 250,
    buttonHeight: 58,
  },
  tablet: {
    contentWidth: 600,
    gutter: 40,
    topPad: 40,
    titleSize: 40,
    titleLine: 48,
    bodySize: 19,
    bodyLine: 28,
    labelSize: 19,
    rowHeight: 80,
    gap: 14,
    sectionGap: 36,
    artMax: 340,
    buttonHeight: 64,
  },
};

export function onboardingLayout(width: number, height: number): OnboardingLayout {
  const shortSide = Math.min(width, height);
  const breakpoint: Breakpoint = shortSide >= 600 ? 'tablet' : height < 720 ? 'compact' : 'regular';
  const wide = width >= 700 && width > height * 1.15;
  const base = BASE[breakpoint];
  return {
    ...base,
    breakpoint,
    wide,
    width,
    height,
    contentWidth: wide ? Math.min(1080, width - base.gutter * 2) : base.contentWidth,
    // En horizontal manda la altura: la figura no puede pasar de la mitad de la pantalla.
    artMax: wide ? Math.min(base.artMax, height * 0.5) : base.artMax,
    topPad: wide ? Math.min(base.topPad, 16) : base.topPad,
  };
}

export function useOnboardingLayout(): OnboardingLayout {
  const { width, height } = useWindowDimensions();
  return useMemo(() => onboardingLayout(width, height), [width, height]);
}

/** El onboarding va siempre en blanco, aunque el teléfono esté en modo oscuro. */
export function useOnboardingPalette(): OnboardingPalette {
  return onboardingLight;
}
