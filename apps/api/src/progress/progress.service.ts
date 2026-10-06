import {
  newerSnapshot,
  UserProgressSchema,
  type ProgressResponse,
  type ProgressSnapshot,
} from '@manta/shared';
import { Injectable } from '@nestjs/common';
import { isUniqueViolation } from '../prisma/errors.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** El progreso en la nube. El teléfono es el que manda: aquí solo se guarda la versión más reciente. */
@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<ProgressResponse> {
    const row = await this.prisma.userProgress.findUnique({ where: { userId } });
    return { snapshot: row ? storedSnapshot(row) : null };
  }

  /** Guarda la versión que llega si es más reciente que la guardada. Devuelve la que vale. */
  async save(
    userId: string,
    sent: ProgressSnapshot,
    now: Date = new Date(),
  ): Promise<ProgressResponse> {
    const incoming = notInTheFuture(sent, now);
    const row = await this.prisma.userProgress.findUnique({ where: { userId } });
    const stored = row ? storedSnapshot(row) : null;
    if (stored && newerSnapshot(stored, incoming) === stored) return { snapshot: stored };

    const data = { data: incoming.progress, clientUpdatedAt: new Date(incoming.updatedAt) };
    if (row) {
      // Solo escribe si nadie guardó otra versión mientras tanto (dos teléfonos a la vez).
      const { count } = await this.prisma.userProgress.updateMany({
        where: { userId, clientUpdatedAt: row.clientUpdatedAt },
        data,
      });
      if (count === 0) return this.get(userId);
    } else {
      try {
        await this.prisma.userProgress.create({ data: { userId, ...data } });
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        return this.get(userId);
      }
    }
    return { snapshot: incoming };
  }
}

/** Lo guardado se vuelve a validar: si ya no cuadra con el formato actual, gana el teléfono. */
export function storedSnapshot(row: {
  data: unknown;
  clientUpdatedAt: Date;
}): ProgressSnapshot | null {
  const parsed = UserProgressSchema.safeParse(row.data);
  return parsed.success
    ? { progress: parsed.data, updatedAt: row.clientUpdatedAt.toISOString() }
    : null;
}

/** Un teléfono con la hora adelantada no puede ganar para siempre: el futuro cuenta como ahora. */
export function notInTheFuture(snapshot: ProgressSnapshot, now: Date): ProgressSnapshot {
  return Date.parse(snapshot.updatedAt) > now.getTime()
    ? { ...snapshot, updatedAt: now.toISOString() }
    : snapshot;
}
