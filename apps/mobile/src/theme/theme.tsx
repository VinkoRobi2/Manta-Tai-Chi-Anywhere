import { light, type Palette } from './tokens';

/** Paleta de los componentes base (Press, Text): siempre la clara, con fondo blanco. */
export function useTheme(): Palette {
  return light;
}
