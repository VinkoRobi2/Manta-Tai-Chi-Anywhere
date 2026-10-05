import { describe, expect, it } from 'vitest';
import { planVoyage, voyageLessonCount, type VoyageCandidate } from './voyage.js';

const MB = 1024 * 1024;

const lesson = (slug: string, overrides: Partial<VoyageCandidate> = {}): VoyageCandidate => ({
  slug,
  spaceMode: 'SEATED',
  durationSec: 420,
  sizeBytes: 20 * MB,
  anchored: false,
  accessible: true,
  ...overrides,
});

describe('voyageLessonCount', () => {
  it('propone unas 4 clases por semana', () => {
    expect([7, 14, 21, 30].map(voyageLessonCount)).toEqual([4, 8, 12, 18]);
  });
});

describe('planVoyage', () => {
  const catalog = [
    lesson('a', { anchored: true }),
    lesson('b'),
    lesson('forma', { spaceMode: 'FULL_FORM' }),
    lesson('c', { spaceMode: 'STANDING_IN_PLACE' }),
    lesson('d'),
    lesson('e'),
  ];

  it('respeta el orden del catálogo y deja fuera la forma completa', () => {
    const plan = planVoyage(7, catalog);
    expect(plan.lessons.map((item) => item.slug)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('solo descarga lo que falta', () => {
    const plan = planVoyage(7, catalog);
    expect(plan.totalBytes).toBe(80 * MB);
    expect(plan.bytesToDownload).toBe(60 * MB);
  });

  it('avisa cuando el plan queda corto por falta de acceso', () => {
    const limited = [lesson('a'), lesson('premium', { accessible: false })];
    const plan = planVoyage(14, limited);
    expect(plan.lessons).toHaveLength(1);
    expect(plan.limitedByAccess).toBe(true);
  });

  it('no avisa si simplemente no hay más clases', () => {
    expect(planVoyage(30, [lesson('a')]).limitedByAccess).toBe(false);
  });
});
