import { dayKey, type PracticeRecord } from './progress.js';

/**
 * Las cuentas de la pantalla de inicio. Funciones puras: la app las calcula en el teléfono
 * (sin internet) con las prácticas guardadas, y reciben "ahora" desde afuera para probarlas.
 */

/** Periodos de las estadísticas, en días: los últimos 7, 30 o 90 contando hoy. */
export const STAT_PERIODS = [7, 30, 90] as const;
export type StatPeriod = (typeof STAT_PERIODS)[number];

export interface PeriodStats {
  /** Días distintos con al menos una práctica. */
  activeDays: number;
  sessions: number;
  minutes: number;
  /** Porcentaje de prácticas que terminaron "en calma" entre las que tienen respuesta; null si ninguna. */
  calmPercent: number | null;
}

export interface PeriodComparison {
  days: number;
  current: PeriodStats;
  /** Los mismos días justo antes: sirve para mostrar si va subiendo. */
  previous: PeriodStats;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Suma días en hora local (respeta los cambios de horario). */
function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Estadísticas de las prácticas entre `from` (incluido) y `to` (excluido). */
export function periodStats(records: readonly PracticeRecord[], from: Date, to: Date): PeriodStats {
  const days = new Set<string>();
  let sessions = 0;
  let seconds = 0;
  let answered = 0;
  let calm = 0;

  for (const record of records) {
    if (record.completedAt < from || record.completedAt >= to) continue;
    sessions += 1;
    seconds += record.durationSec;
    days.add(dayKey(record.completedAt));
    if (record.mood) {
      answered += 1;
      if (record.mood === 'CALM') calm += 1;
    }
  }

  return {
    activeDays: days.size,
    sessions,
    minutes: Math.round(seconds / 60),
    calmPercent: answered === 0 ? null : Math.round((calm / answered) * 100),
  };
}

/** Los últimos `days` días (contando hoy) comparados con los `days` anteriores. */
export function comparePeriods(
  records: readonly PracticeRecord[],
  now: Date,
  days: number,
): PeriodComparison {
  const end = addDays(startOfDay(now), 1);
  const start = addDays(end, -days);
  const previousStart = addDays(start, -days);
  return {
    days,
    current: periodStats(records, start, end),
    previous: periodStats(records, previousStart, start),
  };
}

export type PathStepState = 'done' | 'current' | 'upcoming' | 'locked';

export interface PathLesson {
  slug: string;
  isPremium: boolean;
}

export interface PathStep<T extends PathLesson> {
  lesson: T;
  state: PathStepState;
}

export interface LearningPath<T extends PathLesson> {
  steps: PathStep<T>[];
  /** La clase que toca ahora (puede estar bloqueada); null si ya practicó todas. */
  currentIndex: number | null;
  doneCount: number;
  completed: boolean;
}

/**
 * El camino de un programa: las clases en orden, cuáles ya practicó y cuál toca.
 * Toca la primera que todavía no practicó, aunque haya saltado alguna. Las de Premium
 * sin acceso quedan bloqueadas, también si son la que toca.
 */
export function learningPath<T extends PathLesson>(
  lessons: readonly T[],
  practiced: ReadonlySet<string>,
  hasPremium: boolean,
): LearningPath<T> {
  const currentIndex = lessons.findIndex((lesson) => !practiced.has(lesson.slug));
  const steps = lessons.map((lesson, index): PathStep<T> => {
    if (practiced.has(lesson.slug)) return { lesson, state: 'done' };
    if (lesson.isPremium && !hasPremium) return { lesson, state: 'locked' };
    return { lesson, state: index === currentIndex ? 'current' : 'upcoming' };
  });
  const doneCount = steps.filter((step) => step.state === 'done').length;
  return {
    steps,
    currentIndex: currentIndex === -1 ? null : currentIndex,
    doneCount,
    completed: currentIndex === -1,
  };
}
