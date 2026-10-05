import { z } from 'zod';
import { LocaleSchema } from './enums.js';

/**
 * Una clase es una línea de tiempo: qué clip del instructor se reproduce,
 * cuándo, a qué velocidad y qué audio de voz suena. La app solo la interpreta;
 * agregar clases nuevas es agregar datos, no código.
 */
export const TimelineSegmentSchema = z.object({
  /** Nombre del clip de animación (.glb) dentro del paquete. */
  clip: z.string().min(1),
  startMs: z.number().int().nonnegative(),
  durationMs: z.number().int().positive(),
  playbackRate: z.number().positive().max(2).default(1),
  /** Archivo de voz que suena al empezar el segmento. */
  cue: z.string().optional(),
  /** Si el modo espejo puede invertir este clip. */
  mirrorable: z.boolean().default(true),
});
export type TimelineSegment = z.infer<typeof TimelineSegmentSchema>;

export const LessonTimelineSchema = z.object({
  schemaVersion: z.literal(1),
  lessonSlug: z.string().min(1),
  locale: LocaleSchema,
  totalDurationMs: z.number().int().positive(),
  /** Archivo .glb del personaje. */
  character: z.string().min(1),
  segments: z.array(TimelineSegmentSchema).min(1),
});
export type LessonTimeline = z.infer<typeof LessonTimelineSchema>;
