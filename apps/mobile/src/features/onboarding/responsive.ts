import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { useTheme } from '@/theme/theme';
import { onboardingDark, onboardingLight, type OnboardingPalette } from '@/theme/tokens';

/**
 * Las "media queries" del onboarding. React Native no tiene CSS, así que los cortes se calculan
 * con el tamaño real de la ventana (useWindowDimensions), que cambia al girar el teléfono,
 * al abrir un plegable o en pantalla dividida en iPad y Android.
 *
 * - compact: teléfonos bajos (iPhone SE, Android de 640 dp de alto).
 * - regular: la mayoría de los teléfonos.
 * - tablet: el lado corto mide 600 dp o más (iPad, tablets Android, plegables abiertos).
 * - wide: además, si la ventana es apaisada y ancha, las preguntas y la figura van lado a lado.
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
  /** Aire entre la zona segura y el título. */
  topPad: number;
  titleSize: number;
  titleLine: number;
  bodySize: number;
  bodyLine: number;
  labelSize: number;
  optionHeight: number;
  tileHeight: number;
  gap: number;
  /** Separación entre el texto y las opciones. */
  sectionGap: number;
  /** Altura máxima y mínima de la figura grande. */
  artMax: number;
  artMin: number;
  footerHeight: number;
}

const BASE: Record<
  Breakpoint,
  Omit<OnboardingLayout, 'breakpoint' | 'wide' | 'width' | 'height'>
> = {
  compact: {
    contentWidth: 480,
    gutter: 20,
    topPad: 20,
    titleSize: 22,
    titleLine: 27,
    bodySize: 15,
    bodyLine: 21,
    labelSize: 15,
    optionHeight: 50,
    tileHeight: 76,
    gap: 8,
    sectionGap: 18,
    artMax: 230,
    artMin: 150,
    footerHeight: 56,
  },
  regular: {
    contentWidth: 480,
    gutter: 24,
    topPad: 44,
    titleSize: 26,
    titleLine: 30,
    bodySize: 16,
    bodyLine: 24,
    labelSize: 16,
    optionHeight: 58,
    tileHeight: 90,
    gap: 10,
    sectionGap: 26,
    artMax: 320,
    artMin: 200,
    footerHeight: 64,
  },
  tablet: {
    contentWidth: 600,
    gutter: 40,
    topPad: 64,
    titleSize: 34,
    titleLine: 40,
    bodySize: 19,
    bodyLine: 28,
    labelSize: 18,
    optionHeight: 68,
    tileHeight: 112,
    gap: 14,
    sectionGap: 34,
    artMax: 460,
    artMin: 280,
    footerHeight: 76,
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
    // En horizontal la altura manda: la figura no puede pasar del 62 % de la pantalla.
    artMax: wide ? Math.min(base.artMax, height * 0.62) : base.artMax,
    topPad: wide ? Math.min(base.topPad, 32) : base.topPad,
  };
}

export function useOnboardingLayout(): OnboardingLayout {
  const { width, height } = useWindowDimensions();
  return useMemo(() => onboardingLayout(width, height), [width, height]);
}

export function useOnboardingPalette(): OnboardingPalette {
  return useTheme().scheme === 'dark' ? onboardingDark : onboardingLight;
}
