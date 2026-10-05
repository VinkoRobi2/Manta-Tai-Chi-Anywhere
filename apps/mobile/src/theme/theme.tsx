import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useSettings } from '@/features/settings/settings';

import { cabin, light, type Palette } from './tokens';

const ThemeContext = createContext<Palette>(light);

/** El modo sigue al sistema, salvo que la persona elija claro o cabina en Ajustes. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { appearance } = useSettings();
  const system = useColorScheme();
  const dark = appearance === 'cabin' || (appearance === 'system' && system === 'dark');
  return <ThemeContext.Provider value={dark ? cabin : light}>{children}</ThemeContext.Provider>;
}

/** Fuerza una paleta en una parte de la app (el reproductor siempre usa la oscura). */
export function ThemeOverride({ palette, children }: { palette: Palette; children: ReactNode }) {
  return <ThemeContext.Provider value={palette}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Palette {
  return useContext(ThemeContext);
}
