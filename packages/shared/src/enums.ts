import { z } from 'zod';

/** Idiomas de la app. El primero es el idioma por defecto y de respaldo. */
export const LOCALES = ['es', 'en', 'de'] as const;
export const LocaleSchema = z.enum(LOCALES);
export type Locale = z.infer<typeof LocaleSchema>;
export const DEFAULT_LOCALE: Locale = 'es';

/** Cuánto espacio tiene la persona hoy. Debe coincidir con el enum SpaceMode de Prisma. */
export const SPACE_MODES = ['SEATED', 'STANDING_IN_PLACE', 'FULL_FORM'] as const;
export const SpaceModeSchema = z.enum(SPACE_MODES);
export type SpaceMode = z.infer<typeof SpaceModeSchema>;

export const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export const LevelSchema = z.enum(LEVELS);
export type Level = z.infer<typeof LevelSchema>;
