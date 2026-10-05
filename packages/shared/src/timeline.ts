import { z } from 'zod';
import { LocaleSchema } from './enums.js';

/** Subtítulo que aparece (y se lee en voz) en un momento del segmento. */
export const TimelineCaptionSchema = z.object({
  /** Milisegundos desde el inicio del segmento. */
  atMs: z.number().int().nonnegative(),
  text: z.string().min(1),
});
export type TimelineCaption = z.infer<typeof TimelineCaptionSchema>;

export const BREATH_PHASES = ['in', 'out', 'hold'] as const;
export const BreathPhaseSchema = z.enum(BREATH_PHASES);
export type BreathPhase = z.infer<typeof BreathPhaseSchema>;

/** Una fase de respiración: la marea del reproductor sube con 'in' y baja con 'out'. */
export const TimelineBreathSchema = z.object({
  /** Milisegundos desde el inicio del segmento. */
  atMs: z.number().int().nonnegative(),
  phase: BreathPhaseSchema,
  durationMs: z.number().int().positive(),
});
export type TimelineBreath = z.infer<typeof TimelineBreathSchema>;

/**
 * Una clase es una línea de tiempo: qué video del instructor se reproduce,
 * cuándo, a qué velocidad, qué se dice y cómo se respira. La app solo la
 * interpreta; agregar clases nuevas es agregar datos, no código.
 */
export const TimelineSegmentSchema = z.object({
  /** Nombre del movimiento, por ejemplo "Manos de nube". */
  title: z.string().min(1).optional(),
  /** Nombre original en chino, por ejemplo "云手". */
  hanzi: z.string().min(1).optional(),
  /** Pronunciación del nombre original, por ejemplo "yún shǒu". */
  pinyin: z.string().min(1).optional(),
  /** Video del instructor (vista de frente) dentro del paquete, por ejemplo "manos-de-nube.mp4". */
  clip: z.string().min(1),
  /** Video opcional del mismo movimiento visto de lado. */
  clipSide: z.string().min(1).optional(),
  startMs: z.number().int().nonnegative(),
  durationMs: z.number().int().positive(),
  playbackRate: z.number().positive().max(2).default(1),
  /** Archivo de voz que suena al empezar el segmento. */
  cue: z.string().optional(),
  /** Si el modo espejo puede invertir este clip. */
  mirrorable: z.boolean().default(true),
  captions: z.array(TimelineCaptionSchema).default([]),
  breath: z.array(TimelineBreathSchema).default([]),
});
export type TimelineSegment = z.infer<typeof TimelineSegmentSchema>;

export const LessonTimelineSchema = z.object({
  schemaVersion: z.literal(1),
  lessonSlug: z.string().min(1),
  locale: LocaleSchema,
  totalDurationMs: z.number().int().positive(),
  segments: z.array(TimelineSegmentSchema).min(1),
});
export type LessonTimeline = z.infer<typeof LessonTimelineSchema>;
export type LessonTimelineInput = z.input<typeof LessonTimelineSchema>;

/**
 * Revisa lo que el esquema no puede: orden de segmentos, solapes y tiempos internos.
 * Devuelve la lista de problemas; vacía significa que la línea de tiempo es válida.
 */
export function findTimelineProblems(timeline: LessonTimeline): string[] {
  const problems: string[] = [];
  let previousEnd = 0;

  timeline.segments.forEach((segment, index) => {
    const label = `segmento ${index + 1}`;
    if (segment.startMs < previousEnd) {
      problems.push(`${label} empieza antes de que termine el anterior`);
    }
    const end = segment.startMs + segment.durationMs;
    if (end > timeline.totalDurationMs) {
      problems.push(`${label} termina después de totalDurationMs`);
    }
    for (const caption of segment.captions) {
      if (caption.atMs >= segment.durationMs) {
        problems.push(`${label}: subtítulo fuera del segmento (${caption.atMs} ms)`);
      }
    }
    for (const breath of segment.breath) {
      if (breath.atMs >= segment.durationMs) {
        problems.push(`${label}: respiración fuera del segmento (${breath.atMs} ms)`);
      }
    }
    previousEnd = end;
  });

  return problems;
}

/** Valida una línea de tiempo completa. Lanza un error legible si algo está mal. */
export function parseTimeline(input: unknown): LessonTimeline {
  const timeline = LessonTimelineSchema.parse(input);
  const problems = findTimelineProblems(timeline);
  if (problems.length > 0) {
    throw new Error(`Línea de tiempo inválida (${timeline.lessonSlug}): ${problems.join('; ')}`);
  }
  return timeline;
}
