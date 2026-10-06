import {
  comparePeriods,
  dayKey,
  DEFAULT_WEEKLY_GOAL,
  learningPath,
  STAT_PERIODS,
  tideWeek,
  type LearningPath,
  type Locale,
  type PeriodComparison,
  type StatPeriod,
  type TideWeek,
} from '@manta/shared';

import { programsForMode, type Lesson, type Program } from '@/features/catalog/catalog';
import type { PracticeEntry } from '@/features/practice/practice';
import type { PracticeMode } from '@/features/settings/settings';

/**
 * Todo lo que muestra Inicio, calculado en el teléfono con las prácticas guardadas.
 * Sin red: la pantalla se ve igual en un barco que en casa.
 */

export interface TodayLesson {
  lesson: Lesson;
  program: Program;
  /** Es de Premium y la persona no lo tiene. */
  locked: boolean;
}

export interface HomeModel {
  week: TideWeek;
  /** Prácticas desde siempre. */
  totalSessions: number;
  practicedToday: boolean;
  periods: Record<StatPeriod, PeriodComparison>;
  /** El programa en curso y su camino. */
  program: Program;
  path: LearningPath<Lesson>;
  /** La clase que toca; null si ya practicó todas las de sus programas. */
  today: TodayLesson | null;
}

export function homeModel(
  entries: readonly PracticeEntry[],
  options: { locale: Locale; mode: PracticeMode; hasPremium: boolean; now: Date },
): HomeModel {
  const { locale, mode, hasPremium, now } = options;
  const practiced = new Set(entries.map((entry) => entry.lessonSlug));
  const programs = programsForMode(locale, mode);

  // El programa en curso: el primero (según cómo practica) que todavía tiene clases por hacer.
  const paths = programs.map((program) => ({
    program,
    path: learningPath(program.lessons, practiced, hasPremium),
  }));
  const active = paths.find((item) => !item.path.completed) ?? paths[0]!;
  const current =
    active.path.currentIndex === null ? null : active.program.lessons[active.path.currentIndex];

  const todayKey = dayKey(now);
  const periods = Object.fromEntries(
    STAT_PERIODS.map((days) => [days, comparePeriods(entries, now, days)]),
  ) as Record<StatPeriod, PeriodComparison>;

  return {
    week: tideWeek(entries, now, DEFAULT_WEEKLY_GOAL),
    totalSessions: entries.length,
    practicedToday: entries.some((entry) => dayKey(entry.completedAt) === todayKey),
    periods,
    program: active.program,
    path: active.path,
    today: current
      ? { lesson: current, program: active.program, locked: current.isPremium && !hasPremium }
      : null,
  };
}

/** Saludo según la hora del teléfono. */
export function greetingKey(now: Date): 'morning' | 'afternoon' | 'evening' {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 19) return 'afternoon';
  return 'evening';
}
