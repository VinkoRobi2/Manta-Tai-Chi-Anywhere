import type { PracticeList, PracticeSession, PracticeUploadResult } from '@manta/shared';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Las prácticas de la persona en la nube. El teléfono las guarda primero y las sube cuando hay
 * señal; cada una trae su propio id, así que reintentar una subida nunca la duplica.
 */
@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  /** Guarda las que faltan y devuelve los ids que ya están en la nube para esta persona. */
  async upload(
    userId: string,
    sessions: readonly PracticeSession[],
    now: Date = new Date(),
  ): Promise<PracticeUploadResult> {
    await this.prisma.practiceSession.createMany({
      data: sessions.map((session) => ({
        id: session.id,
        userId,
        lessonSlug: session.lessonSlug,
        completedAt: notInTheFuture(new Date(session.completedAt), now),
        durationSec: session.durationSec,
        mood: session.mood,
        spaceMode: session.spaceMode,
      })),
      skipDuplicates: true,
    });
    // Un id repetido de otra persona no cuenta como guardado: solo se confirman los propios.
    const saved = await this.prisma.practiceSession.findMany({
      where: { userId, id: { in: sessions.map((session) => session.id) } },
      select: { id: true },
    });
    return { saved: saved.map((row) => row.id) };
  }

  async list(userId: string): Promise<PracticeList> {
    const rows = await this.prisma.practiceSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'asc' },
    });
    return {
      sessions: rows.map((row) => ({
        id: row.id,
        lessonSlug: row.lessonSlug,
        completedAt: row.completedAt.toISOString(),
        durationSec: row.durationSec,
        mood: row.mood,
        spaceMode: row.spaceMode,
      })),
    };
  }
}

/** Un teléfono con la hora adelantada no puede registrar prácticas en el futuro. */
export function notInTheFuture(date: Date, now: Date): Date {
  return date.getTime() > now.getTime() ? now : date;
}
