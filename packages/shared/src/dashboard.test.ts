import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { comparePeriods, learningPath, periodStats } from './dashboard.js';
import { PracticeSessionSchema, toPracticeRecord } from './practice.js';
import type { PracticeRecord } from './progress.js';
import { STARTER_PROGRAMS } from './starter-catalog.js';

// Fechas locales para que los tests no dependan de la zona horaria de la máquina.
const at = (month: number, day: number, hour = 8) => new Date(2026, month, day, hour);
const NOW = at(9, 8, 12); // jueves 8 de octubre de 2026, mediodía

const RECORDS: PracticeRecord[] = [
  { completedAt: at(9, 8, 7), durationSec: 420, mood: 'CALM' }, // hoy
  { completedAt: at(9, 8, 19), durationSec: 300, mood: 'SLIGHT' }, // hoy otra vez
  { completedAt: at(9, 5), durationSec: 600, mood: 'CALM' }, // lunes
  { completedAt: at(9, 2), durationSec: 360, mood: null }, // hace 6 días: entra en los 7
  { completedAt: at(9, 1), durationSec: 480, mood: 'ROUGH' }, // hace 7 días: periodo anterior
  { completedAt: at(8, 20), durationSec: 540, mood: 'CALM' }, // septiembre
];

describe('periodStats', () => {
  it('cuenta días distintos, prácticas, minutos y calma', () => {
    expect(periodStats(RECORDS, at(9, 2, 0), at(9, 9, 0))).toEqual({
      activeDays: 3,
      sessions: 4,
      minutes: 28,
      calmPercent: 67,
    });
  });

  it('sin prácticas: todo en cero y la calma sin dato', () => {
    expect(periodStats([], at(9, 1, 0), at(9, 9, 0))).toEqual({
      activeDays: 0,
      sessions: 0,
      minutes: 0,
      calmPercent: null,
    });
  });
});

describe('comparePeriods', () => {
  it('los últimos 7 días cuentan hoy y se comparan con los 7 anteriores', () => {
    const week = comparePeriods(RECORDS, NOW, 7);
    expect(week.current).toMatchObject({ activeDays: 3, sessions: 4 });
    expect(week.previous).toMatchObject({ activeDays: 1, sessions: 1, calmPercent: 0 });
  });

  it('30 días incluye septiembre', () => {
    expect(comparePeriods(RECORDS, NOW, 30).current.sessions).toBe(6);
  });

  it('una práctica de esta noche, más tarde que "ahora", sigue contando hoy', () => {
    const tonight = comparePeriods(RECORDS, at(9, 8, 6), 7);
    expect(tonight.current.sessions).toBe(4);
  });
});

describe('learningPath', () => {
  const lessons = [
    { slug: 'a', isPremium: false },
    { slug: 'b', isPremium: false },
    { slug: 'c', isPremium: true },
    { slug: 'd', isPremium: true },
  ];

  it('sin práctica, toca la primera', () => {
    const path = learningPath(lessons, new Set(), false);
    expect(path.currentIndex).toBe(0);
    expect(path.steps.map((step) => step.state)).toEqual([
      'current',
      'upcoming',
      'locked',
      'locked',
    ]);
  });

  it('toca la primera sin practicar aunque haya saltado alguna', () => {
    const path = learningPath(lessons, new Set(['b']), true);
    expect(path.currentIndex).toBe(0);
    expect(path.doneCount).toBe(1);
    expect(path.steps.map((step) => step.state)).toEqual([
      'current',
      'done',
      'upcoming',
      'upcoming',
    ]);
  });

  it('la que toca puede estar bloqueada sin Premium', () => {
    const path = learningPath(lessons, new Set(['a', 'b']), false);
    expect(path.currentIndex).toBe(2);
    expect(path.steps[2]?.state).toBe('locked');
  });

  it('todas practicadas: el programa está completo', () => {
    const path = learningPath(lessons, new Set(['a', 'b', 'c', 'd']), false);
    expect(path).toMatchObject({ currentIndex: null, doneCount: 4, completed: true });
  });
});

describe('prácticas', () => {
  it('valida lo que sube el teléfono y lo convierte en registro', () => {
    const session = PracticeSessionSchema.parse({
      id: '3f2b8c1e-6a4d-4f7e-9b2a-1c3d5e7f9a0b',
      lessonSlug: 'sentado-manos-de-nube',
      completedAt: '2026-10-08T12:30:00.000Z',
      durationSec: 480,
      mood: 'CALM',
      spaceMode: 'SEATED',
    });
    expect(toPracticeRecord(session)).toEqual({
      lessonSlug: 'sentado-manos-de-nube',
      completedAt: new Date('2026-10-08T12:30:00.000Z'),
      durationSec: 480,
      mood: 'CALM',
    });
  });

  it('rechaza ids que no son UUID y duraciones imposibles', () => {
    const base = {
      id: '3f2b8c1e-6a4d-4f7e-9b2a-1c3d5e7f9a0b',
      lessonSlug: 'x',
      completedAt: '2026-10-08T12:30:00.000Z',
      durationSec: 60,
      mood: null,
      spaceMode: 'SEATED',
    };
    expect(PracticeSessionSchema.safeParse({ ...base, id: '1' }).success).toBe(false);
    expect(PracticeSessionSchema.safeParse({ ...base, durationSec: 0 }).success).toBe(false);
    expect(PracticeSessionSchema.safeParse({ ...base, durationSec: 5 * 3600 }).success).toBe(false);
  });
});

describe('STARTER_PROGRAMS', () => {
  const recipes = JSON.parse(
    readFileSync(new URL('../../../content/guiones/clases.json', import.meta.url), 'utf8'),
  ) as { slug: string; movements: { durationSec: number }[] }[];

  it('cada clase existe en los guiones y dura lo mismo', () => {
    const lessons = STARTER_PROGRAMS.flatMap((program) => program.lessons);
    expect(lessons.map((lesson) => lesson.slug).sort()).toEqual(
      recipes.map((recipe) => recipe.slug).sort(),
    );
    for (const lesson of lessons) {
      const recipe = recipes.find((item) => item.slug === lesson.slug);
      const total = recipe?.movements.reduce((sum, movement) => sum + movement.durationSec, 0);
      expect(total, lesson.slug).toBe(lesson.durationSec);
    }
  });

  it('las primeras clases de sentado y de pie son gratis', () => {
    for (const slug of ['sentado-basico', 'en-el-lugar']) {
      const program = STARTER_PROGRAMS.find((item) => item.slug === slug);
      expect(program?.isPremium).toBe(false);
      expect(program?.lessons[0]?.isPremium).toBe(false);
    }
  });
});
