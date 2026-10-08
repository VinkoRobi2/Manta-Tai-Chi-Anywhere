import type { SpaceMode } from '@manta/shared';

/**
 * Las fotos de las clases y los programas. Las clases en silla tienen cada una su foto. Las de pie
 * y la forma completa, por ahora, salen de una sola sesión de fotos: cada clase con su propio
 * encuadre (las manos, el perfil, los pies…), así ninguna se ve igual. Cuando una clase tenga su
 * foto, se cambia aquí.
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

interface Photo {
  source: number;
  size: { width: number; height: number };
}

/** Todas las fotos miden 1440 × 2580 (vertical, 9:16). */
const SIZE = { width: 1440, height: 2580 };

function photo(source: number): Photo {
  return { source, size: SIZE };
}

const PHOTOS = {
  seatedFirst: photo(require('../../../assets/images/lessons/sentado-primeros-movimientos.jpg')),
  seatedCloud: photo(require('../../../assets/images/lessons/sentado-manos-de-nube.jpg')),
  seatedChest: photo(require('../../../assets/images/lessons/sentado-abrir-el-pecho.jpg')),
  seatedCrane: photo(require('../../../assets/images/lessons/sentado-grulla.jpg')),
  seatedKnee: photo(require('../../../assets/images/lessons/sentado-cepillar-rodilla.jpg')),
  standing: photo(require('../../../assets/images/lessons/en-el-lugar-manos-de-nube.jpg')),
};

/** Las fotos de la bienvenida: la de sentado y la de de pie. */
export const SEATED_PHOTO = PHOTOS.seatedFirst.source;
export const STANDING_PHOTO = PHOTOS.standing.source;

function art({ source, size }: Photo, x: number, y: number, zoom = 1): PhotoArt {
  return { source, size, focus: { x, y }, zoom };
}

const LESSON_ART: Partial<Record<string, PhotoArt>> = {
  'sentado-primeros-movimientos': art(PHOTOS.seatedFirst, 0.45, 0.42),
  'sentado-manos-de-nube': art(PHOTOS.seatedCloud, 0.55, 0.42, 1.12),
  'sentado-abrir-el-pecho': art(PHOTOS.seatedChest, 0.5, 0.42, 1.05),
  'sentado-grulla': art(PHOTOS.seatedCrane, 0.5, 0.42, 1.12),
  'sentado-cepillar-rodilla': art(PHOTOS.seatedKnee, 0.52, 0.43, 1.12),
  'en-el-lugar-manos-de-nube': art(PHOTOS.standing, 0.5, 0.45),
  'en-el-lugar-abrir-el-pecho': art(PHOTOS.standing, 0.5, 0.33, 1.5),
  'en-el-lugar-grulla': art(PHOTOS.standing, 0.32, 0.28, 1.6),
  'en-el-lugar-marea-completa': art(PHOTOS.standing, 0.62, 0.45, 1.2),
  'forma-24-apertura': art(PHOTOS.standing, 0.56, 0.78, 1.6),
  'forma-24-grulla': art(PHOTOS.standing, 0.62, 0.3, 1.4),
};

const PROGRAM_ART: Partial<Record<string, PhotoArt>> = {
  'sentado-basico': art(PHOTOS.seatedFirst, 0.45, 0.4),
  'en-el-lugar': art(PHOTOS.standing, 0.5, 0.42),
  'forma-24': art(PHOTOS.standing, 0.55, 0.72, 1.35),
};

/** Para clases o programas nuevos que todavía no tienen encuadre: la foto de su forma de practicar. */
const MODE_ART: Record<SpaceMode, PhotoArt> = {
  SEATED: art(PHOTOS.seatedFirst, 0.45, 0.42),
  STANDING_IN_PLACE: art(PHOTOS.standing, 0.5, 0.45),
  FULL_FORM: art(PHOTOS.standing, 0.6, 0.4, 1.2),
};

export function lessonArt(lesson: { slug: string; spaceMode: SpaceMode }): PhotoArt {
  return LESSON_ART[lesson.slug] ?? MODE_ART[lesson.spaceMode];
}

export function programArt(program: { slug: string; spaceMode: SpaceMode }): PhotoArt {
  return PROGRAM_ART[program.slug] ?? MODE_ART[program.spaceMode];
}
