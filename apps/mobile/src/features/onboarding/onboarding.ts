import { MAX_GOALS, type OnboardingAnswers, type OnboardingProgress } from '@manta/shared';
import type { Href } from 'expo-router';

import {
  getOnboardingProgress,
  onProgressReplaced,
  saveOnboardingProgress,
} from '@/features/progress/progress';
import {
  updateSettings,
  type CareTag,
  type Goal,
  type OfflineUsage,
} from '@/features/settings/settings';
import { track } from '@/lib/analytics';
import { createStore, useStore } from '@/lib/store';

/**
 * Onboarding: cinco preguntas y un plan. Cada respuesta y cada pantalla se guardan al momento como
 * progreso (en el teléfono y, con cuenta, en la nube), así se retoma donde quedó aunque no haya señal.
 * Las respuestas pasan a Ajustes solo al terminar.
 */

/** Rutas de las preguntas, en orden. La bienvenida y el plan no cuentan como pasos. */
export const ONBOARDING_STEPS = ['practica', 'sentir', 'tiempo', 'zonas', 'sin-internet'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Pantallas desde las que se puede retomar: las preguntas y el plan. */
export type OnboardingScreen = NonNullable<OnboardingProgress['screen']>;

export const SCREEN_HREF = {
  practica: '/bienvenida/practica',
  sentir: '/bienvenida/sentir',
  tiempo: '/bienvenida/tiempo',
  zonas: '/bienvenida/zonas',
  'sin-internet': '/bienvenida/sin-internet',
  plan: '/bienvenida/plan',
} as const satisfies Record<OnboardingScreen, Href>;

export { MAX_GOALS };

/** Zonas que se ofrecen en el onboarding (las muñecas se eligen antes de cada clase). */
export const ONBOARDING_CARE_TAGS = [
  'knees',
  'back',
  'shoulders',
  'neck',
] as const satisfies readonly CareTag[];

export type OnboardingDraft = OnboardingAnswers;

const INITIAL_DRAFT: OnboardingDraft = {
  practiceMode: 'seated',
  goals: ['calm'],
  dailyMinutes: 10,
  careTags: [],
  noCare: false,
  offlineUsage: 'sometimes',
  forRelative: false,
};

const draftStore = createStore<OnboardingDraft>(INITIAL_DRAFT);
/** Dónde va la persona y si ya terminó: junto con las respuestas, es el progreso que se guarda. */
let screen: OnboardingScreen | null = null;
let completed = false;

function saveProgress(): void {
  saveOnboardingProgress({ screen, completed, answers: draftStore.get() });
}

export function useOnboardingDraft(): OnboardingDraft {
  return useStore(draftStore);
}

export function updateDraft(patch: Partial<OnboardingDraft>): void {
  draftStore.set((current) => ({ ...current, ...patch }));
  saveProgress();
}

/** Empieza de cero. Para un familiar, las preguntas hablan de "su" práctica. */
export function startOnboarding(forRelative: boolean): void {
  draftStore.set({ ...INITIAL_DRAFT, forRelative });
  screen = null;
  completed = false;
  saveProgress();
  track('onboarding_started', { forRelative });
}

/** Recupera el progreso guardado: al abrir la app y al entrar con una cuenta. */
export function restoreOnboarding(): void {
  const saved = getOnboardingProgress();
  draftStore.set(saved?.answers ?? INITIAL_DRAFT);
  screen = saved?.screen ?? null;
  completed = saved?.completed ?? false;
}

// Si llega de la nube una versión más reciente, las preguntas muestran esa.
onProgressReplaced(restoreOnboarding);

/** ¿Hay algo que retomar? */
export function hasOnboardingProgress(): boolean {
  return screen !== null || completed;
}

/** Donde quedó la persona: el plan si ya terminó, si no la última pregunta que vio. */
export function resumeHref(): Href {
  return SCREEN_HREF[completed ? 'plan' : (screen ?? 'practica')];
}

/** Cada pantalla avisa cuando se ve: así se sabe desde dónde retomar. */
export function markScreen(next: OnboardingScreen): void {
  if (screen === next) return;
  screen = next;
  saveProgress();
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

export function wantsAutoAnchor(usage: OfflineUsage): boolean {
  return usage !== 'rarely';
}

export function stepNumber(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step) + 1;
}

export function trackStep(step: OnboardingStep): void {
  track('onboarding_step_completed', { step: stepNumber(step) });
}

/** Termina el onboarding: guarda las respuestas en Ajustes y marca el progreso como completo. */
export function completeOnboarding(): OnboardingDraft {
  const draft = draftStore.get();
  completed = true;
  screen = 'plan';
  saveProgress();
  updateSettings({
    onboardingDone: true,
    practiceMode: draft.practiceMode,
    goals: draft.goals,
    dailyMinutes: draft.dailyMinutes,
    careTags: draft.noCare ? [] : draft.careTags,
    offlineUsage: draft.offlineUsage,
    autoAnchorFree: wantsAutoAnchor(draft.offlineUsage),
    setupForRelative: draft.forRelative,
  });
  track('onboarding_completed', {
    practiceMode: draft.practiceMode,
    goals: draft.goals.join(','),
    dailyMinutes: draft.dailyMinutes,
    careCount: draft.careTags.length,
    offlineUsage: draft.offlineUsage,
    forRelative: draft.forRelative,
  });
  return draft;
}
