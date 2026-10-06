import {
  parseTimeline,
  STARTER_PROGRAMS,
  type LessonTimeline,
  type Level,
  type Locale,
  type SpaceMode,
} from '@manta/shared';

import type { PracticeMode } from '@/features/settings/settings';

import { PACKAGED_TIMELINES } from './timelines.generated';

/**
 * Las clases que la app lleva dentro: funcionan sin internet desde el primer día.
 * Vienen de STARTER_PROGRAMS (@manta/shared), los mismos programas que la API carga con el seed.
 */

export interface Lesson {
  slug: string;
  programSlug: string;
  /** Posición dentro del programa, desde 1. */
  number: number;
  durationSec: number;
  isPremium: boolean;
  spaceMode: SpaceMode;
  title: string;
  summary: string;
}

export interface Program {
  slug: string;
  spaceMode: SpaceMode;
  level: Level;
  isPremium: boolean;
  title: string;
  description: string;
  lessons: Lesson[];
}

/** El catálogo en el idioma de la app. */
export function catalog(locale: Locale): Program[] {
  return STARTER_PROGRAMS.map((program) => ({
    slug: program.slug,
    spaceMode: program.spaceMode,
    level: program.level,
    isPremium: program.isPremium,
    title: program.title[locale],
    description: program.description[locale],
    lessons: program.lessons.map((lesson, index) => ({
      slug: lesson.slug,
      programSlug: program.slug,
      number: index + 1,
      durationSec: lesson.durationSec,
      isPremium: program.isPremium || lesson.isPremium,
      spaceMode: program.spaceMode,
      title: lesson.title[locale],
      summary: lesson.summary[locale],
    })),
  }));
}

export function findLesson(
  locale: Locale,
  slug: string,
): { lesson: Lesson; program: Program } | null {
  for (const program of catalog(locale)) {
    const lesson = program.lessons.find((item) => item.slug === slug);
    if (lesson) return { lesson, program };
  }
  return null;
}

/** El programa de cada forma de practicar. "Las dos" empieza sentado: es lo más seguro. */
const PROGRAM_FOR_MODE: Record<PracticeMode, string> = {
  seated: 'sentado-basico',
  standing: 'en-el-lugar',
  both: 'sentado-basico',
};

/** El programa principal según el onboarding y, si ya lo terminó, el siguiente que tenga sentido. */
export function programsForMode(locale: Locale, mode: PracticeMode): Program[] {
  const programs = catalog(locale);
  const first = programs.find((program) => program.slug === PROGRAM_FOR_MODE[mode]);
  const rest = programs.filter((program) => program !== first);
  // Con "las dos", después de sentado viene de pie; la forma completa siempre va al final.
  return first ? [first, ...rest] : programs;
}

/** La línea de tiempo de una clase, ya validada. null si la app no la trae. */
export function lessonTimeline(slug: string, locale: Locale): LessonTimeline | null {
  const raw = PACKAGED_TIMELINES[slug]?.[locale];
  return raw ? parseTimeline(raw) : null;
}
