import { z } from 'zod';

/**
 * Cuenta y progreso: lo que viaja entre la app y la API.
 * El progreso se guarda primero en el teléfono (funciona sin internet) y se sube a la nube
 * cuando hay sesión y señal. Si dos versiones chocan, gana la que se cambió más tarde.
 */

/** Respuestas del onboarding. */
export const PRACTICE_MODES = ['seated', 'standing', 'both'] as const;
export const GOALS = ['calm', 'balance', 'joints', 'sleep', 'energy'] as const;
export const MAX_GOALS = 2;
export const DAILY_MINUTES = [5, 10, 20] as const;
export const CARE_TAGS = ['shoulders', 'back', 'knees', 'wrists', 'neck'] as const;
export const OFFLINE_USAGES = ['often', 'sometimes', 'rarely'] as const;
/** Pantallas del onboarding desde las que se puede retomar: las cinco preguntas y el plan. */
export const ONBOARDING_SCREENS = [
  'practica',
  'sentir',
  'tiempo',
  'zonas',
  'sin-internet',
  'plan',
] as const;

export const OnboardingAnswersSchema = z.object({
  practiceMode: z.enum(PRACTICE_MODES),
  goals: z.array(z.enum(GOALS)).max(MAX_GOALS),
  dailyMinutes: z.literal(DAILY_MINUTES),
  careTags: z.array(z.enum(CARE_TAGS)).max(CARE_TAGS.length),
  /** Eligió "Ninguna" a propósito. */
  noCare: z.boolean(),
  offlineUsage: z.enum(OFFLINE_USAGES),
  /** Lo está configurando otra persona para un familiar. */
  forRelative: z.boolean(),
});
export type OnboardingAnswers = z.infer<typeof OnboardingAnswersSchema>;

export const OnboardingProgressSchema = z.object({
  /** Última pantalla vista: desde aquí se retoma. null = todavía no empezó las preguntas. */
  screen: z.enum(ONBOARDING_SCREENS).nullable(),
  completed: z.boolean(),
  answers: OnboardingAnswersSchema,
});
export type OnboardingProgress = z.infer<typeof OnboardingProgressSchema>;

/** Todo el progreso de la persona. Por ahora, el onboarding. */
export const UserProgressSchema = z.object({
  onboarding: OnboardingProgressSchema,
});
export type UserProgress = z.infer<typeof UserProgressSchema>;

/** Una versión del progreso con la hora (del teléfono) en que cambió. */
export const ProgressSnapshotSchema = z.object({
  progress: UserProgressSchema,
  updatedAt: z.iso.datetime(),
});
export type ProgressSnapshot = z.infer<typeof ProgressSnapshotSchema>;

/** GET y PUT /v1/me/progress responden la versión que vale (null si todavía no hay ninguna). */
export const ProgressResponseSchema = z.object({
  snapshot: ProgressSnapshotSchema.nullable(),
});
export type ProgressResponse = z.infer<typeof ProgressResponseSchema>;

/** Gana la versión cambiada más tarde. Si empatan, se queda la que ya estaba guardada. */
export function newerSnapshot(
  stored: ProgressSnapshot | null,
  incoming: ProgressSnapshot,
): ProgressSnapshot {
  if (!stored) return incoming;
  return Date.parse(incoming.updatedAt) > Date.parse(stored.updatedAt) ? incoming : stored;
}

/** Con qué se puede entrar. */
export const AUTH_PROVIDERS = ['apple', 'google'] as const;
export const AuthProviderSchema = z.enum(AUTH_PROVIDERS);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

export const AppleSignInSchema = z.object({
  identityToken: z.string().min(1).max(4096),
  /** Apple manda el nombre solo la primera vez: la app lo reenvía para guardarlo. */
  fullName: z.string().trim().min(1).max(120).nullable().optional(),
});
export type AppleSignIn = z.infer<typeof AppleSignInSchema>;

export const GoogleSignInSchema = z.object({
  idToken: z.string().min(1).max(4096),
});
export type GoogleSignIn = z.infer<typeof GoogleSignInSchema>;

export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

/** Respuesta al entrar: la sesión de Manta (un token propio, no el de Apple ni el de Google). */
export const AuthSessionSchema = z.object({
  token: z.string().min(1),
  user: AuthUserSchema,
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;
