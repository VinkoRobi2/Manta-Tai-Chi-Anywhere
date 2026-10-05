import type { Locale } from '@manta/shared';

import { storage } from '@/db/storage';
import { createStore, useStore } from '@/lib/store';
import type { Appearance } from '@/theme/tokens';

export const CARE_TAGS = ['shoulders', 'back', 'knees', 'wrists'] as const;
export type CareTag = (typeof CARE_TAGS)[number];

export type CaptionSize = 'normal' | 'large' | 'xlarge';

export interface Reminder {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface Settings {
  language: 'system' | Locale;
  appearance: Appearance;
  captionSize: CaptionSize;
  breathHaptics: boolean;
  reminder: Reminder;
  /** Ya se ofreció el recordatorio al terminar una clase. */
  reminderAsked: boolean;
  weeklyGoal: number;
  careTags: CareTag[];
  /** Caché local del acceso premium: funciona sin señal. */
  premium: boolean;
  sessionsCompleted: number;
  firstLessonCompletedAt: string | null;
  lastReviewAskAt: string | null;
  safetySeen: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'system',
  appearance: 'system',
  captionSize: 'normal',
  breathHaptics: true,
  reminder: { enabled: false, hour: 7, minute: 30 },
  reminderAsked: false,
  weeklyGoal: 3,
  careTags: [],
  premium: false,
  sessionsCompleted: 0,
  firstLessonCompletedAt: null,
  lastReviewAskAt: null,
  safetySeen: false,
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
