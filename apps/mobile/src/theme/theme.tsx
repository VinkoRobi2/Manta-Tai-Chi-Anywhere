import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useSettings } from '@/features/settings/settings';

import { abisal, tinta, type Palette } from './tokens';

const ThemeContext = createContext<Palette>(tinta);

/**
 * De día, Tinta; de noche, Abisal. Sigue al sistema, salvo que la persona
 * elija Día o Noche (modo cabina) en Ajustes.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { appearance } = useSettings();
  const system = useColorScheme();
  const night = appearance === 'cabin' || (appearance === 'system' && system === 'dark');
  return <ThemeContext.Provider value={night ? abisal : tinta}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Palette {
  return useContext(ThemeContext);
}
