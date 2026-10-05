import { z } from 'zod';

/** Variables de entorno validadas al arrancar: si falta algo, la API no levanta. */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGINS: z.string().default('http://localhost:3001'),
  REVENUECAT_WEBHOOK_SECRET: z.string().min(16, 'debe tener al menos 16 caracteres'),
  REVENUECAT_ENTITLEMENT_ID: z.string().min(1).default('premium'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().min(1).default('manta-content'),
  CONTENT_DEV_BASE_URL: z.string().min(1).default('http://localhost:8787'),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variables de entorno inválidas en apps/api/.env:\n${problems}`);
  }
  return parsed.data;
}
