import type { SpaceMode } from '@manta/shared';

import { anchorFreeLessonsOnWifi } from '@/features/downloads/autoAnchor';
import {
  updateSettings,
  type CareTag,
  type DailyMinutes,
  type Goal,
  type OfflineUsage,
  type PracticeMode,
  type Settings,
} from '@/features/settings/settings';
import { track } from '@/lib/analytics';
import { createStore, useStore } from '@/lib/store';

/**
 * Onboarding: cinco preguntas y un plan. Las respuestas viven en un borrador en memoria
 * y se guardan en Ajustes solo al terminar, así "Atrás" y "Cambiar mis respuestas" no ensucian nada.
 */

/** Rutas de las preguntas, en orden. La bienvenida y el plan no cuentan como pasos. */
export const ONBOARDING_STEPS = ['practica', 'sentir', 'tiempo', 'zonas', 'sin-internet'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const MAX_GOALS = 2;

/** Zonas que se ofrecen en el onboarding (las muñecas se eligen antes de cada clase). */
export const ONBOARDING_CARE_TAGS = [
  'knees',
  'back',
  'shoulders',
  'neck',
] as const satisfies readonly CareTag[];

/** Las preguntas empiezan sin respuesta: "Continuar" se activa al elegir. Los minutos parten en 10. */
export interface OnboardingDraft {
  practiceMode: PracticeMode | null;
  goals: Goal[];
  dailyMinutes: DailyMinutes;
  careTags: CareTag[];
  /** Eligió "Ninguna" a propósito. */
  noCare: boolean;
  offlineUsage: OfflineUsage | null;
  /** Lo está configurando otra persona para un familiar. */
  forRelative: boolean;
}

const INITIAL_DRAFT: OnboardingDraft = {
  practiceMode: null,
  goals: [],
  dailyMinutes: 10,
  careTags: [],
  noCare: false,
  offlineUsage: null,
  forRelative: false,
};

/** Respuestas por defecto si alguien llega al final sin responder (por ejemplo, saltando). */
export const DEFAULT_PRACTICE: PracticeMode = 'seated';
export const DEFAULT_OFFLINE: OfflineUsage = 'sometimes';
export const RECOMMENDED_MINUTES: DailyMinutes = 10;

/** ¿Se puede pasar a la siguiente pregunta? */
export function canContinue(step: OnboardingStep, draft: OnboardingDraft): boolean {
  switch (step) {
    case 'practica':
      return draft.practiceMode !== null;
    case 'sentir':
      return draft.goals.length > 0;
    case 'tiempo':
      return true;
    case 'zonas':
      return draft.noCare || draft.careTags.length > 0;
    case 'sin-internet':
      return draft.offlineUsage !== null;
  }
}

const draftStore = createStore<OnboardingDraft>(INITIAL_DRAFT);

export function useOnboardingDraft(): OnboardingDraft {
  return useStore(draftStore);
}

export function updateDraft(patch: Partial<OnboardingDraft>): void {
  draftStore.set((current) => ({ ...current, ...patch }));
}

export function startOnboarding(forRelative: boolean): void {
  draftStore.set({ ...INITIAL_DRAFT, forRelative });
  track('onboarding_started', { forRelative });
}

/** Hasta dos objetivos: si ya hay dos, el más antiguo deja su lugar al nuevo. */
export function toggleGoal(goals: readonly Goal[], goal: Goal): Goal[] {
  if (goals.includes(goal)) return goals.filter((item) => item !== goal);
  return [...goals, goal].slice(-MAX_GOALS);
}

/** Elegir una zona quita "Ninguna"; elegir "Ninguna" quita las zonas. */
export function toggleCare(
  draft: Pick<OnboardingDraft, 'careTags' | 'noCare'>,
  tag: CareTag | 'none',
): Pick<OnboardingDraft, 'careTags' | 'noCare'> {
  if (tag === 'none') return { careTags: [], noCare: !draft.noCare };
  const careTags = draft.careTags.includes(tag)
    ? draft.careTags.filter((item) => item !== tag)
    : [...draft.careTags, tag];
  return { careTags, noCare: false };
}

/** El espacio de la primera clase. "Las dos" empieza sentado: es lo más seguro para arrancar. */
export function spaceForPractice(mode: PracticeMode | null): SpaceMode {
  return mode === 'standing' ? 'STANDING_IN_PLACE' : 'SEATED';
}

export function wantsAutoAnchor(usage: OfflineUsage | null): boolean {
  return (usage ?? DEFAULT_OFFLINE) !== 'rarely';
}

export function stepNumber(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step) + 1;
}

export function trackStep(step: OnboardingStep): void {
  track('onboarding_step_completed', { step: stepNumber(step) });
}

/** Guarda las respuestas en Ajustes y, si practica sin internet, empieza a anclar con Wi-Fi. */
export function completeOnboarding(): OnboardingDraft {
  const draft = draftStore.get();
  const autoAnchorFree = wantsAutoAnchor(draft.offlineUsage);
  const practiceMode = draft.practiceMode ?? DEFAULT_PRACTICE;
  const offlineUsage = draft.offlineUsage ?? DEFAULT_OFFLINE;
  updateSettings({
    onboardingDone: true,
    practiceMode,
    goals: draft.goals,
    dailyMinutes: draft.dailyMinutes,
    careTags: draft.noCare ? [] : draft.careTags,
    offlineUsage,
    autoAnchorFree,
    setupForRelative: draft.forRelative,
  });
  track('onboarding_completed', {
    practiceMode,
    goals: draft.goals.join(','),
    dailyMinutes: draft.dailyMinutes,
    careCount: draft.careTags.length,
    offlineUsage,
    forRelative: draft.forRelative,
  });
  if (autoAnchorFree) void anchorFreeLessonsOnWifi();
  return draft;
}

/** "Ya tengo cuenta": entra directo a la app con los valores por defecto. */
export function skipOnboarding(): void {
  updateSettings({ onboardingDone: true });
  track('onboarding_skipped');
}

/** Quien ya practicó con una versión anterior no tiene que pasar por el onboarding. */
export function isOnboarded(settings: Pick<Settings, 'onboardingDone' | 'sessionsCompleted'>) {
  return settings.onboardingDone || settings.sessionsCompleted > 0;
}
