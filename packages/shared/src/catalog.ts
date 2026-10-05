import { z } from 'zod';
import { LevelSchema, LocaleSchema, SpaceModeSchema } from './enums.js';

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, 'sha256 en hexadecimal');

/** Un archivo de un paquete de clase, con su hash para verificar la descarga. */
export const PackageFileSchema = z.object({
  path: z.string().min(1),
  sha256: Sha256Schema,
  sizeBytes: z.number().int().nonnegative(),
});
export type PackageFile = z.infer<typeof PackageFileSchema>;

/** manifest.json que acompaña a cada paquete en el bucket. */
export const LessonPackageManifestSchema = z.object({
  schemaVersion: z.literal(1),
  lessonSlug: z.string().min(1),
  locale: LocaleSchema,
  version: z.number().int().positive(),
  files: z.array(PackageFileSchema).min(1),
});
export type LessonPackageManifest = z.infer<typeof LessonPackageManifestSchema>;

export const CatalogLessonSchema = z.object({
  id: z.string(),
  slug: z.string(),
  durationSec: z.number().int().positive(),
  isPremium: z.boolean(),
  title: z.string(),
  summary: z.string(),
  packageVersion: z.number().int().positive().nullable(),
  packageBytes: z.number().int().nonnegative().nullable(),
});
export type CatalogLesson = z.infer<typeof CatalogLessonSchema>;

export const CatalogProgramSchema = z.object({
  id: z.string(),
  slug: z.string(),
  spaceMode: SpaceModeSchema,
  level: LevelSchema,
  isPremium: z.boolean(),
  title: z.string(),
  description: z.string(),
  lessons: z.array(CatalogLessonSchema),
});
export type CatalogProgram = z.infer<typeof CatalogProgramSchema>;

/** Lo que la app descarga para saber qué clases existen. */
export const CatalogManifestSchema = z.object({
  generatedAt: z.string(),
  locale: LocaleSchema,
  programs: z.array(CatalogProgramSchema),
});
export type CatalogManifest = z.infer<typeof CatalogManifestSchema>;

/** Respuesta de la API al pedir una descarga: enlaces temporales por archivo. */
export const DownloadGrantSchema = z.object({
  lessonSlug: z.string(),
  locale: LocaleSchema,
  version: z.number().int().positive(),
  expiresInSeconds: z.number().int().positive(),
  files: z.array(PackageFileSchema.extend({ url: z.string() })),
});
export type DownloadGrant = z.infer<typeof DownloadGrantSchema>;
