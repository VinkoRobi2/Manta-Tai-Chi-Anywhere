import { z } from 'zod';
import { SpaceModeSchema } from './enums.js';
import { SeaStateSchema, type PracticeRecord } from './progress.js';

/**
 * Prácticas terminadas: lo que viaja entre la app y la API.
 * Cada práctica nace en el teléfono (con o sin internet) con un id propio. Subirla dos veces
 * no la duplica, así que la app puede reintentar sin miedo cuando vuelve la señal.
 */

/** Más de 4 horas no es una clase: es un reloj que se quedó corriendo. */
export const MAX_PRACTICE_SECONDS = 4 * 60 * 60;
/** Prácticas por subida. Si hay más pendientes, se suben en varias vueltas. */
export const MAX_PRACTICE_BATCH = 100;

export const PracticeSessionSchema = z.object({
  id: z.uuid(),
  lessonSlug: z.string().min(1).max(80),
  completedAt: z.iso.datetime(),
  durationSec: z.number().int().min(1).max(MAX_PRACTICE_SECONDS),
  /** Cómo se sintió al terminar; null si no respondió. */
  mood: SeaStateSchema.nullable(),
  spaceMode: SpaceModeSchema,
});
export type PracticeSession = z.infer<typeof PracticeSessionSchema>;

/** PUT /v1/me/sessions */
export const PracticeUploadSchema = z.object({
  sessions: z.array(PracticeSessionSchema).min(1).max(MAX_PRACTICE_BATCH),
});
export type PracticeUpload = z.infer<typeof PracticeUploadSchema>;

/** Respuesta a la subida: los ids que ya están guardados en la nube (nuevos o repetidos). */
export const PracticeUploadResultSchema = z.object({
  saved: z.array(z.string()),
});
export type PracticeUploadResult = z.infer<typeof PracticeUploadResultSchema>;

/** GET /v1/me/sessions: todas las prácticas de la cuenta, para recuperarlas en otro teléfono. */
export const PracticeListSchema = z.object({
  sessions: z.array(PracticeSessionSchema),
});
export type PracticeList = z.infer<typeof PracticeListSchema>;

/** Una práctica guardada como registro para las cuentas de progreso (fechas como Date). */
export function toPracticeRecord(
  session: PracticeSession,
): PracticeRecord & { lessonSlug: string } {
  return {
    lessonSlug: session.lessonSlug,
    completedAt: new Date(session.completedAt),
    durationSec: session.durationSec,
    mood: session.mood,
  };
}
