import {
  CatalogManifestSchema,
  DEFAULT_LOCALE,
  parseTimeline,
  type CatalogManifest,
  type LessonTimeline,
  type Level,
  type Locale,
  type SpaceMode,
} from '@manta/shared';

import { PACKAGED_TIMELINES } from './timelines.generated';

/**
 * Catálogo de ejemplo de la Fase 1. Tiene la misma forma que GET /v1/catalog
 * (CatalogManifest), así que reemplazarlo por la API es cambiar de dónde viene.
 */

type Texts = Record<Locale, { title: string; body: string }>;

interface SampleLesson {
  slug: string;
  texts: Texts;
  /** Tamaño del paquete con videos (estimado hasta tener los videos reales). */
  packageMb: number;
  /** Viene dentro de la app: funciona sin descargar nada. */
  packaged: boolean;
}

interface SampleProgram {
  slug: string;
  spaceMode: SpaceMode;
  level: Level;
  isPremium: boolean;
  texts: Texts;
  lessons: SampleLesson[];
}

const PROGRAMS: SampleProgram[] = [
  {
    slug: 'sentado-basico',
    spaceMode: 'SEATED',
    level: 'BEGINNER',
    isPremium: false,
    texts: {
      es: { title: 'Tai chi sentado', body: 'Movimientos completos desde una silla.' },
      en: { title: 'Seated tai chi', body: 'Complete movements from a chair.' },
      de: { title: 'Tai Chi im Sitzen', body: 'Vollständige Bewegungen auf einem Stuhl.' },
    },
    lessons: [
      {
        slug: 'sentado-primeros-movimientos',
        packageMb: 18,
        packaged: true,
        texts: {
          es: { title: 'Primeros movimientos', body: 'Comienzo, manos de nube y cierre.' },
          en: { title: 'First movements', body: 'Commencement, cloud hands and closing.' },
          de: { title: 'Erste Bewegungen', body: 'Eröffnung, Wolkenhände und Abschluss.' },
        },
      },
      {
        slug: 'sentado-manos-de-nube',
        packageMb: 22,
        packaged: true,
        texts: {
          es: {
            title: 'Manos de nube sentado',
            body: 'El movimiento más conocido del tai chi, desde la silla.',
          },
          en: {
            title: 'Seated cloud hands',
            body: 'The best-known tai chi movement, from your chair.',
          },
          de: {
            title: 'Wolkenhände im Sitzen',
            body: 'Die bekannteste Tai-Chi-Bewegung, auf dem Stuhl.',
          },
        },
      },
      {
        slug: 'sentado-abrir-el-pecho',
        packageMb: 19,
        packaged: true,
        texts: {
          es: { title: 'Abrir el pecho', body: 'Respirar ancho después de horas encorvado.' },
          en: { title: 'Opening the chest', body: 'Breathe wide after hours hunched over.' },
          de: { title: 'Brust öffnen', body: 'Weit atmen nach Stunden in gebeugter Haltung.' },
        },
      },
      {
        slug: 'sentado-grulla',
        packageMb: 21,
        packaged: true,
        texts: {
          es: { title: 'La grulla abre las alas', body: 'Brazos que suben y bajan con calma.' },
          en: { title: 'White crane spreads its wings', body: 'Arms that rise and fall, calmly.' },
          de: {
            title: 'Der Kranich breitet die Flügel aus',
            body: 'Arme, die ruhig steigen und sinken.',
          },
        },
      },
      {
        slug: 'sentado-cepillar-rodilla',
        packageMb: 24,
        packaged: true,
        texts: {
          es: { title: 'Cepillar la rodilla', body: 'Empujar suave, girar desde la cintura.' },
          en: { title: 'Brush knee', body: 'Push gently, turn from the waist.' },
          de: { title: 'Knie streifen', body: 'Sanft schieben, aus der Taille drehen.' },
        },
      },
    ],
  },
  {
    slug: 'en-el-lugar',
    spaceMode: 'STANDING_IN_PLACE',
    level: 'BEGINNER',
    isPremium: true,
    texts: {
      es: { title: 'De pie, en el lugar', body: 'Tai chi en un metro cuadrado.' },
      en: { title: 'Standing in place', body: 'Tai chi in one square meter.' },
      de: { title: 'Im Stehen, auf der Stelle', body: 'Tai Chi auf einem Quadratmeter.' },
    },
    lessons: [
      {
        slug: 'en-el-lugar-manos-de-nube',
        packageMb: 26,
        packaged: false,
        texts: {
          es: {
            title: 'Manos de nube sin desplazarte',
            body: 'La forma clásica adaptada al lugar.',
          },
          en: {
            title: 'Cloud hands without stepping',
            body: 'The classic form adapted to stay in place.',
          },
          de: { title: 'Wolkenhände ohne Schritte', body: 'Die klassische Form auf der Stelle.' },
        },
      },
      {
        slug: 'en-el-lugar-abrir-el-pecho',
        packageMb: 22,
        packaged: false,
        texts: {
          es: { title: 'Abrir el pecho de pie', body: 'Pies quietos, pecho ancho.' },
          en: { title: 'Opening the chest, standing', body: 'Still feet, wide chest.' },
          de: { title: 'Brust öffnen im Stehen', body: 'Ruhige Füße, weite Brust.' },
        },
      },
      {
        slug: 'en-el-lugar-grulla',
        packageMb: 24,
        packaged: false,
        texts: {
          es: { title: 'La grulla en el lugar', body: 'Equilibrio sin dar un paso.' },
          en: { title: 'White crane in place', body: 'Balance without taking a step.' },
          de: { title: 'Der Kranich auf der Stelle', body: 'Gleichgewicht ohne einen Schritt.' },
        },
      },
      {
        slug: 'en-el-lugar-marea-completa',
        packageMb: 31,
        packaged: false,
        texts: {
          es: {
            title: 'Marea completa',
            body: 'Tres movimientos enlazados, sin moverte del sitio.',
          },
          en: { title: 'Full tide', body: 'Three linked movements, without leaving your spot.' },
          de: {
            title: 'Volle Flut',
            body: 'Drei verbundene Bewegungen, ohne den Platz zu verlassen.',
          },
        },
      },
    ],
  },
  {
    slug: 'forma-24',
    spaceMode: 'FULL_FORM',
    level: 'INTERMEDIATE',
    isPremium: true,
    texts: {
      es: { title: 'Forma de 24 movimientos', body: 'La forma Yang simplificada.' },
      en: { title: '24-movement form', body: 'The simplified Yang form.' },
      de: { title: 'Die 24er-Form', body: 'Die vereinfachte Yang-Form.' },
    },
    lessons: [
      {
        slug: 'forma-24-apertura',
        packageMb: 34,
        packaged: false,
        texts: {
          es: {
            title: 'Apertura y primeros pasos',
            body: 'Comienzo y la crin del caballo salvaje.',
          },
          en: {
            title: 'Opening and first steps',
            body: "Commencement and parting the wild horse's mane.",
          },
          de: {
            title: 'Eröffnung und erste Schritte',
            body: 'Eröffnung und die Mähne des Wildpferdes.',
          },
        },
      },
      {
        slug: 'forma-24-grulla',
        packageMb: 29,
        packaged: false,
        texts: {
          es: { title: 'La crin y la grulla', body: 'Movimientos 2 y 3 de la forma.' },
          en: { title: 'The mane and the crane', body: 'Movements 2 and 3 of the form.' },
          de: { title: 'Mähne und Kranich', body: 'Bewegungen 2 und 3 der Form.' },
        },
      },
    ],
  },
];

const MB = 1024 * 1024;

export interface LessonInfo {
  slug: string;
  programSlug: string;
  spaceMode: SpaceMode;
  level: Level;
  isPremium: boolean;
  packaged: boolean;
  title: string;
  summary: string;
  durationSec: number;
  packageBytes: number;
}

export interface ProgramInfo {
  slug: string;
  spaceMode: SpaceMode;
  level: Level;
  isPremium: boolean;
  title: string;
  description: string;
  lessons: LessonInfo[];
}

const timelineCache = new Map<string, LessonTimeline | null>();

/** Línea de tiempo de una clase en el idioma pedido, o en español si no existe. Validada. */
export function loadTimeline(slug: string, locale: Locale): LessonTimeline | null {
  const key = `${slug}:${locale}`;
  if (!timelineCache.has(key)) {
    const raw = PACKAGED_TIMELINES[slug]?.[locale] ?? PACKAGED_TIMELINES[slug]?.[DEFAULT_LOCALE];
    timelineCache.set(key, raw ? parseTimeline(raw) : null);
  }
  return timelineCache.get(key) ?? null;
}

function durationOf(slug: string): number {
  const timeline = loadTimeline(slug, DEFAULT_LOCALE);
  return timeline ? Math.round(timeline.totalDurationMs / 1000) : 0;
}

const programsCache = new Map<Locale, ProgramInfo[]>();

export function getPrograms(locale: Locale): ProgramInfo[] {
  const cached = programsCache.get(locale);
  if (cached) return cached;
  const programs = PROGRAMS.map((program) => ({
    slug: program.slug,
    spaceMode: program.spaceMode,
    level: program.level,
    isPremium: program.isPremium,
    title: program.texts[locale].title,
    description: program.texts[locale].body,
    lessons: program.lessons.map((lesson) => ({
      slug: lesson.slug,
      programSlug: program.slug,
      spaceMode: program.spaceMode,
      level: program.level,
      isPremium: program.isPremium,
      packaged: lesson.packaged,
      title: lesson.texts[locale].title,
      summary: lesson.texts[locale].body,
      durationSec: durationOf(lesson.slug),
      packageBytes: lesson.packageMb * MB,
    })),
  }));
  programsCache.set(locale, programs);
  return programs;
}

export function getLessons(locale: Locale): LessonInfo[] {
  return getPrograms(locale).flatMap((program) => program.lessons);
}

export function getLesson(slug: string, locale: Locale): LessonInfo | undefined {
  return getLessons(locale).find((lesson) => lesson.slug === slug);
}

/** La próxima clase de un espacio: la primera que todavía no se practicó, o la primera del programa. */
export function nextLessonFor(
  spaceMode: SpaceMode,
  locale: Locale,
  practiced: ReadonlySet<string>,
): LessonInfo {
  const lessons = getLessons(locale).filter((lesson) => lesson.spaceMode === spaceMode);
  return lessons.find((lesson) => !practiced.has(lesson.slug)) ?? lessons[0]!;
}

/** El catálogo con la forma exacta de la API. */
export function getCatalogManifest(locale: Locale): CatalogManifest {
  return CatalogManifestSchema.parse({
    generatedAt: new Date().toISOString(),
    locale,
    programs: getPrograms(locale).map((program) => ({
      id: program.slug,
      slug: program.slug,
      spaceMode: program.spaceMode,
      level: program.level,
      isPremium: program.isPremium,
      title: program.title,
      description: program.description,
      lessons: program.lessons.map((lesson) => ({
        id: lesson.slug,
        slug: lesson.slug,
        durationSec: lesson.durationSec,
        isPremium: lesson.isPremium,
        title: lesson.title,
        summary: lesson.summary,
        packageVersion: 1,
        packageBytes: lesson.packageBytes,
      })),
    })),
  });
}
