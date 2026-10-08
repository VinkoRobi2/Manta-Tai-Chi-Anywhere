import type { SpaceMode } from '@manta/shared';

/**
 * Las fotos de las clases y los programas. Por ahora hay dos sesiones de fotos (sentada y de pie):
 * cada clase tiene su propio encuadre de una de ellas (las manos, el perfil con el mar, las
 * piernas…), así ninguna se ve igual que otra. Cuando una clase tenga su foto, se cambia aquí.
 */

export interface PhotoArt {
  source: number;
  /** Tamaño de la foto en píxeles, para calcular el encuadre. */
  size: { width: number; height: number };
  /** El centro del encuadre, en fracciones de la foto (de 0 a 1). */
  focus: { x: number; y: number };
  /** 1: la foto entera de lado a lado (o de arriba abajo). Más: más cerca. */
  zoom: number;
}

export const SEATED_PHOTO: number = require('../../../assets/images/lessons/sentado-primeros-movimientos.jpg');
export const STANDING_PHOTO: number = require('../../../assets/images/lessons/en-el-lugar-manos-de-nube.jpg');
const SIZE = { width: 1152, height: 2064 };

function art(source: number, x: number, y: number, zoom = 1): PhotoArt {
  return { source, size: SIZE, focus: { x, y }, zoom };
}

const LESSON_ART: Partial<Record<string, PhotoArt>> = {
  'sentado-primeros-movimientos': art(SEATED_PHOTO, 0.45, 0.42),
  'sentado-manos-de-nube': art(SEATED_PHOTO, 0.66, 0.3, 1.6),
  'sentado-abrir-el-pecho': art(SEATED_PHOTO, 0.5, 0.3, 1.45),
  'sentado-grulla': art(SEATED_PHOTO, 0.28, 0.26, 1.35),
  'sentado-cepillar-rodilla': art(SEATED_PHOTO, 0.55, 0.62, 1.5),
  'en-el-lugar-manos-de-nube': art(STANDING_PHOTO, 0.5, 0.45),
  'en-el-lugar-abrir-el-pecho': art(STANDING_PHOTO, 0.5, 0.33, 1.5),
  'en-el-lugar-grulla': art(STANDING_PHOTO, 0.32, 0.28, 1.6),
  'en-el-lugar-marea-completa': art(STANDING_PHOTO, 0.62, 0.45, 1.2),
  'forma-24-apertura': art(STANDING_PHOTO, 0.56, 0.78, 1.6),
  'forma-24-grulla': art(STANDING_PHOTO, 0.62, 0.3, 1.4),
};

const PROGRAM_ART: Partial<Record<string, PhotoArt>> = {
  'sentado-basico': art(SEATED_PHOTO, 0.45, 0.4),
  'en-el-lugar': art(STANDING_PHOTO, 0.5, 0.42),
  'forma-24': art(STANDING_PHOTO, 0.55, 0.72, 1.35),
};

/** Para clases o programas nuevos que todavía no tienen encuadre: la foto de su forma de practicar. */
const MODE_ART: Record<SpaceMode, PhotoArt> = {
  SEATED: art(SEATED_PHOTO, 0.45, 0.42),
  STANDING_IN_PLACE: art(STANDING_PHOTO, 0.5, 0.45),
  FULL_FORM: art(STANDING_PHOTO, 0.6, 0.4, 1.2),
};

export function lessonArt(lesson: { slug: string; spaceMode: SpaceMode }): PhotoArt {
  return LESSON_ART[lesson.slug] ?? MODE_ART[lesson.spaceMode];
}

export function programArt(program: { slug: string; spaceMode: SpaceMode }): PhotoArt {
  return PROGRAM_ART[program.slug] ?? MODE_ART[program.spaceMode];
}
