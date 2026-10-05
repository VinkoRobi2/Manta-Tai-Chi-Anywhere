import { z } from 'zod';

/**
 * Cómo se siente la persona después de practicar, con la escala del mar:
 * En calma, Marejadilla, Marejada, Mar picado.
 */
export const SEA_STATES = ['CALM', 'SLIGHT', 'MODERATE', 'ROUGH'] as const;
export const SeaStateSchema = z.enum(SEA_STATES);
export type SeaState = z.infer<typeof SeaStateSchema>;

/** Meta semanal por defecto: 3 mareas (días con práctica). */
export const DEFAULT_WEEKLY_GOAL = 3;

export interface PracticeRecord {
  completedAt: Date;
  durationSec: number;
  mood?: SeaState | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Índice del día con la semana empezando en lunes: lunes 0 … domingo 6. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Lunes a las 00:00 (hora local) de la semana de `date`. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - weekdayIndex(start));
  return start;
}

/** "2026-10-08" en hora local. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export interface TideWeek {
  /** Siete valores, de lunes a domingo: true si hubo práctica ese día. */
  days: boolean[];
  todayIndex: number;
  /** Mareas de la semana: días con práctica, no sesiones. */
  count: number;
  goal: number;
  reached: boolean;
}

/** Las mareas de la semana actual. Se llenan con práctica y nunca se "pierden". */
export function tideWeek(
  records: readonly PracticeRecord[],
  now: Date,
  goal: number = DEFAULT_WEEKLY_GOAL,
): TideWeek {
  const start = startOfWeek(now);
  const nextWeek = new Date(start);
  nextWeek.setDate(start.getDate() + 7);

  const days: boolean[] = Array.from({ length: 7 }, () => false);
  for (const record of records) {
    if (record.completedAt >= start && record.completedAt < nextWeek) {
      days[weekdayIndex(record.completedAt)] = true;
    }
  }
  const count = days.filter(Boolean).length;
  return { days, todayIndex: weekdayIndex(now), count, goal, reached: count >= goal };
}

export interface PracticeTotals {
  weekMinutes: number;
  monthMinutes: number;
  sessions: number;
  /** Estado del mar más frecuente en los últimos 30 días; null si no hay registros. */
  frequentMood: SeaState | null;
}

export function practiceTotals(records: readonly PracticeRecord[], now: Date): PracticeTotals {
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const moodSince = new Date(now.getTime() - 30 * DAY_MS);

  let weekSeconds = 0;
  let monthSeconds = 0;
  const moodCount = new Map<SeaState, number>();

  for (const record of records) {
    if (record.completedAt >= weekStart && record.completedAt <= now) weekSeconds += record.durationSec;
    if (record.completedAt >= monthStart && record.completedAt <= now) monthSeconds += record.durationSec;
    if (record.mood && record.completedAt >= moodSince) {
      moodCount.set(record.mood, (moodCount.get(record.mood) ?? 0) + 1);
    }
  }

  // En empate gana el mar más tranquilo: SEA_STATES está ordenado de calma a picado.
  let frequentMood: SeaState | null = null;
  let best = 0;
  for (const mood of SEA_STATES) {
    const count = moodCount.get(mood) ?? 0;
    if (count > best) {
      best = count;
      frequentMood = mood;
    }
  }

  return {
    weekMinutes: Math.round(weekSeconds / 60),
    monthMinutes: Math.round(monthSeconds / 60),
    sessions: records.length,
    frequentMood,
  };
}

export interface PracticeDay<T extends PracticeRecord> {
  key: string;
  date: Date;
  records: T[];
}

/** Agrupa por día local, del más reciente al más antiguo. */
export function groupByDay<T extends PracticeRecord>(records: readonly T[]): PracticeDay<T>[] {
  const sorted = [...records].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  const groups: PracticeDay<T>[] = [];
  for (const record of sorted) {
    const key = dayKey(record.completedAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.records.push(record);
    } else {
      const date = new Date(
        record.completedAt.getFullYear(),
        record.completedAt.getMonth(),
        record.completedAt.getDate(),
      );
      groups.push({ key, date, records: [record] });
    }
  }
  return groups;
}
