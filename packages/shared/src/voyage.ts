import type { SpaceMode } from './enums.js';

/**
 * "Preparar para zarpar": quien se va días sin señal elige cuántos días y
 * Manta arma un plan de clases para anclar (descargar) de una vez.
 */

export const VOYAGE_DAYS = [7, 14, 21, 30] as const;
export type VoyageDays = (typeof VOYAGE_DAYS)[number];

/** En un barco la forma completa casi nunca cabe: por defecto el plan usa silla y en el lugar. */
export const VOYAGE_SPACE_MODES: readonly SpaceMode[] = ['SEATED', 'STANDING_IN_PLACE'];

export interface VoyageCandidate {
  slug: string;
  spaceMode: SpaceMode;
  durationSec: number;
  sizeBytes: number;
  /** Ya está en el teléfono. */
  anchored: boolean;
  /** La persona tiene acceso (gratis o con Manta completa). */
  accessible: boolean;
}

export interface VoyagePlan<T extends VoyageCandidate> {
  days: number;
  targetCount: number;
  lessons: T[];
  totalBytes: number;
  bytesToDownload: number;
  /** El plan quedó más corto porque faltan clases a las que no hay acceso. */
  limitedByAccess: boolean;
}

/** Unas 4 clases por semana de viaje: 7 → 4, 14 → 8, 21 → 12, 30 → 18. */
export function voyageLessonCount(days: number): number {
  return Math.max(1, Math.ceil((days * 4) / 7));
}

/** Elige las clases en el orden del catálogo, sin pasarse del número objetivo. */
export function planVoyage<T extends VoyageCandidate>(
  days: number,
  candidates: readonly T[],
  spaceModes: readonly SpaceMode[] = VOYAGE_SPACE_MODES,
): VoyagePlan<T> {
  const targetCount = voyageLessonCount(days);
  const fitting = candidates.filter((lesson) => spaceModes.includes(lesson.spaceMode));
  const lessons = fitting.filter((lesson) => lesson.accessible).slice(0, targetCount);

  const totalBytes = lessons.reduce((sum, lesson) => sum + lesson.sizeBytes, 0);
  const bytesToDownload = lessons
    .filter((lesson) => !lesson.anchored)
    .reduce((sum, lesson) => sum + lesson.sizeBytes, 0);

  return {
    days,
    targetCount,
    lessons,
    totalBytes,
    bytesToDownload,
    limitedByAccess: lessons.length < targetCount && fitting.some((lesson) => !lesson.accessible),
  };
}
