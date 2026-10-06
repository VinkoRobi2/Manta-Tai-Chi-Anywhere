import { Prisma } from '../generated/prisma/client.js';

/** Otro proceso creó el mismo registro al mismo tiempo (restricción única). */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
