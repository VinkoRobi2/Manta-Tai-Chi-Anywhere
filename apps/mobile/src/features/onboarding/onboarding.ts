import {
  MAX_GOALS,
  ONBOARDING_SCREENS,
  type OnboardingAnswers,
  type OnboardingProgress,
} from '@manta/shared';
import type { Href } from 'expo-router';

import {
  getOnboardingProgress,
  onProgressReplaced,
  saveOnboardingProgress,
} from '@/features/progress/progress';
import {
  getSettings,
  updateSettings,
  type CareTag,
  type DailyMinutes,
  type Goal,
  type OfflineUsage,
  type PracticeMode,
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
export type OnboardingCareTag = (typeof ONBOARDING_CARE_TAGS)[number];

/** Lo que se guarda mientras una pregunta no tiene respuesta, y lo que se usa si alguien la salta. */
export const DEFAULT_PRACTICE: PracticeMode = 'seated';
export const DEFAULT_OFFLINE: OfflineUsage = 'sometimes';
export const RECOMMENDED_MINUTES: DailyMinutes = 10;

const INITIAL_ANSWERS: OnboardingAnswers = {
  practiceMode: DEFAULT_PRACTICE,
  goals: [],
  dailyMinutes: RECOMMENDED_MINUTES,
  careTags: [],
  noCare: false,
  offlineUsage: DEFAULT_OFFLINE,
  forRelative: false,
};

/**
 * Lo que ven las preguntas. Las respuestas guardadas siempre tienen un valor (así las valida la API),
 * pero en pantalla "Cómo practicar" y "Sin internet" empiezan sin elegir: "Continuar" se activa
 * cuando la persona toca una opción.
 */
export type OnboardingDraft = Omit<OnboardingAnswers, 'practiceMode' | 'offlineUsage'> & {
  practiceMode: PracticeMode | null;
  offlineUsage: OfflineUsage | null;
};

type ChoiceField = 'practiceMode' | 'offlineUsage';

const answersStore = createStore<OnboardingAnswers>(INITIAL_ANSWERS);
/** Preguntas de una sola respuesta ya contestadas. No se guarda: al retomar se deduce de la pantalla. */
let chosen = new Set<ChoiceField>();
/** Dónde va la persona y si ya terminó: junto con las respuestas, es el progreso que se guarda. */
let screen: OnboardingScreen | null = null;
let completed = false;

function saveProgress(): void {
  saveOnboardingProgress({ screen, completed, answers: answersStore.get() });
}

/** Al retomar, las preguntas que ya quedaron atrás cuentan como contestadas. */
function chosenFrom(saved: OnboardingProgress | null): Set<ChoiceField> {
  const result = new Set<ChoiceField>();
  if (!saved) return result;
  const reached = saved.completed
    ? ONBOARDING_SCREENS.length
    : saved.screen
      ? ONBOARDING_SCREENS.indexOf(saved.screen)
      : -1;
  if (reached > ONBOARDING_SCREENS.indexOf('practica')) result.add('practiceMode');
  if (reached > ONBOARDING_SCREENS.indexOf('sin-internet')) result.add('offlineUsage');
  return result;
}

function toDraft(answers: OnboardingAnswers): OnboardingDraft {
  return {
    ...answers,
    practiceMode: chosen.has('practiceMode') ? answers.practiceMode : null,
    offlineUsage: chosen.has('offlineUsage') ? answers.offlineUsage : null,
  };
}

export function useOnboardingDraft(): OnboardingDraft {
  return toDraft(useStore(answersStore));
}

export function updateDraft(patch: Partial<OnboardingAnswers>): void {
  if (patch.practiceMode !== undefined) chosen.add('practiceMode');
  if (patch.offlineUsage !== undefined) chosen.add('offlineUsage');
  answersStore.set((current) => ({ ...current, ...patch }));
  saveProgress();
}

/** Empieza de cero. Para un familiar, las preguntas hablan de "su" práctica. */
export function startOnboarding(forRelative: boolean): void {
  chosen = new Set();
  answersStore.set({ ...INITIAL_ANSWERS, forRelative });
  screen = null;
  completed = false;
  saveProgress();
  track('onboarding_started', { forRelative });
}

/**
 * Recupera el progreso guardado: al abrir la app y al entrar con una cuenta. Si llegó de la nube
 * un onboarding terminado (otro teléfono), sus respuestas pasan a Ajustes y se entra directo a Inicio.
 */
export function restoreOnboarding(): void {
  const saved = getOnboardingProgress();
  chosen = chosenFrom(saved);
  answersStore.set(saved?.answers ?? INITIAL_ANSWERS);
  screen = saved?.screen ?? null;
  completed = saved?.completed ?? false;
  if (saved?.completed && !getSettings().onboardingDone) applyAnswers(saved.answers);
}

// Si llega de la nube una versión más reciente, las preguntas muestran esa.
onProgressReplaced(restoreOnboarding);

/** ¿Hay algo que retomar? */
export function hasOnboardingProgress(): boolean {
  return screen !== null || completed;
}

/** Donde quedó la persona: Inicio si ya terminó, si no la última pregunta que vio. */
export function resumeHref(): Href {
  return completed ? '/inicio' : SCREEN_HREF[screen ?? 'practica'];
}

/** Cada pantalla avisa cuando se ve: así se sabe desde dónde retomar. */
export function markScreen(next: OnboardingScreen): void {
  if (screen === next) return;
  screen = next;
  saveProgress();
}

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

export function wantsAutoAnchor(usage: OfflineUsage | null): boolean {
  return (usage ?? DEFAULT_OFFLINE) !== 'rarely';
}

export function stepNumber(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step) + 1;
}

export function trackStep(step: OnboardingStep): void {
  track('onboarding_step_completed', { step: stepNumber(step) });
}

/** Las respuestas pasan a Ajustes: desde aquí las leen Inicio y las clases. */
function applyAnswers(answers: OnboardingAnswers): void {
  updateSettings({
    onboardingDone: true,
    practiceMode: answers.practiceMode,
    goals: answers.goals,
    dailyMinutes: answers.dailyMinutes,
    careTags: answers.noCare ? [] : answers.careTags,
    offlineUsage: answers.offlineUsage,
    autoAnchorFree: wantsAutoAnchor(answers.offlineUsage),
    setupForRelative: answers.forRelative,
  });
}

/** Termina el onboarding: guarda las respuestas en Ajustes y marca el progreso como completo. */
export function completeOnboarding(): OnboardingAnswers {
  const answers = answersStore.get();
  completed = true;
  screen = 'plan';
  saveProgress();
  applyAnswers(answers);
  track('onboarding_completed', {
    practiceMode: answers.practiceMode,
    goals: answers.goals.join(','),
    dailyMinutes: answers.dailyMinutes,
    careCount: answers.careTags.length,
    offlineUsage: answers.offlineUsage,
    forRelative: answers.forRelative,
  });
  return answers;
}
