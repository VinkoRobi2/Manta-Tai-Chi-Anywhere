import {
  CARE_TAGS,
  DAILY_MINUTES,
  GOALS,
  type Locale,
  type OnboardingAnswers,
} from '@manta/shared';

import { storage } from '@/db/storage';
import { createStore, useStore } from '@/lib/store';

/** Respuestas del onboarding: los valores posibles son los mismos que valida la API. */
export { CARE_TAGS, DAILY_MINUTES, GOALS };
export type CareTag = (typeof CARE_TAGS)[number];
export type PracticeMode = OnboardingAnswers['practiceMode'];
export type Goal = (typeof GOALS)[number];
export type DailyMinutes = (typeof DAILY_MINUTES)[number];
export type OfflineUsage = OnboardingAnswers['offlineUsage'];

export interface Settings {
  /** Idioma elegido en la bienvenida. 'system' sigue al teléfono. */
  language: 'system' | Locale;
  onboardingDone: boolean;
  practiceMode: PracticeMode;
  goals: Goal[];
  dailyMinutes: DailyMinutes;
  careTags: CareTag[];
  offlineUsage: OfflineUsage;
  /** Descargar solas las clases gratis cuando haya Wi-Fi. */
  autoAnchorFree: boolean;
  /** La app la configuró otra persona para un familiar. */
  setupForRelative: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'system',
  onboardingDone: false,
  practiceMode: 'seated',
  goals: [],
  dailyMinutes: 10,
  careTags: [],
  offlineUsage: 'sometimes',
  autoAnchorFree: false,
  setupForRelative: false,
};

const settingsStore = createStore<Settings>(DEFAULT_SETTINGS);

/** Lee las preferencias guardadas. Cada clave se guarda como JSON en la tabla settings. */
export function loadSettings(): Settings {
  const raw = storage.readSettings();
  const loaded: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const value = raw[key];
    if (value === undefined) continue;
    try {
      loaded[key] = JSON.parse(value);
    } catch {
      // Valor ilegible: se queda el valor por defecto.
    }
  }
  settingsStore.set(loaded as unknown as Settings);
  return settingsStore.get();
}

export function getSettings(): Settings {
  return settingsStore.get();
}

export function updateSettings(patch: Partial<Settings>): void {
  for (const [key, value] of Object.entries(patch)) {
    storage.writeSetting(key, JSON.stringify(value));
  }
  settingsStore.set((current) => ({ ...current, ...patch }));
}

export function useSettings(): Settings {
  return useStore(settingsStore);
}
