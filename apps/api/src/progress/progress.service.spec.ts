import type { ProgressSnapshot } from '@manta/shared';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { notInTheFuture, ProgressService, storedSnapshot } from './progress.service.js';

interface Row {
  userId: string;
  data: unknown;
  clientUpdatedAt: Date;
}

/** La tabla UserProgress en memoria, con las mismas reglas que la base de datos. */
class FakeProgressTable {
  rows = new Map<string, Row>();

  findUnique = async ({ where }: { where: { userId: string } }) =>
    this.rows.get(where.userId) ?? null;

  updateMany = async ({
    where,
    data,
  }: {
    where: { userId: string; clientUpdatedAt: Date };
    data: Omit<Row, 'userId'>;
  }) => {
    const row = this.rows.get(where.userId);
    if (!row || row.clientUpdatedAt.getTime() !== where.clientUpdatedAt.getTime())
      return { count: 0 };
    this.rows.set(where.userId, { userId: where.userId, ...data });
    return { count: 1 };
  };

  create = async ({ data }: { data: Row }) => {
    if (this.rows.has(data.userId)) {
      throw new Prisma.PrismaClientKnownRequestError('Ya existe', {
        code: 'P2002',
        clientVersion: 'test',
      });
    }
    this.rows.set(data.userId, data);
    return data;
  };
}

const NOW = new Date('2026-10-05T20:00:00.000Z');

function snapshot(updatedAt: string, screen: 'sentir' | 'plan' = 'sentir'): ProgressSnapshot {
  return {
    updatedAt,
    progress: {
      onboarding: {
        screen,
        completed: screen === 'plan',
        answers: {
          practiceMode: 'seated',
          goals: ['calm'],
          dailyMinutes: 10,
          careTags: [],
          noCare: false,
          offlineUsage: 'sometimes',
          forRelative: false,
        },
      },
    },
  };
}

describe('ProgressService', () => {
  let table: FakeProgressTable;
  let service: ProgressService;

  beforeEach(() => {
    table = new FakeProgressTable();
    service = new ProgressService({ userProgress: table } as unknown as PrismaService);
  });

  it('sin nada guardado, guarda lo que llega', async () => {
    const first = snapshot('2026-10-05T19:00:00.000Z');
    await expect(service.save('ana', first, NOW)).resolves.toEqual({ snapshot: first });
    await expect(service.get('ana')).resolves.toEqual({ snapshot: first });
  });

  it('gana la versión cambiada más tarde, llegue cuando llegue', async () => {
    const older = snapshot('2026-10-05T19:00:00.000Z');
    const newer = snapshot('2026-10-05T19:30:00.000Z', 'plan');
    await service.save('ana', newer, NOW);
    // Un teléfono que estuvo sin señal manda una versión vieja: no pisa la nueva.
    await expect(service.save('ana', older, NOW)).resolves.toEqual({ snapshot: newer });
    await expect(service.get('ana')).resolves.toEqual({ snapshot: newer });
  });

  it('una hora del futuro cuenta como ahora', async () => {
    const result = await service.save('ana', snapshot('2030-01-01T00:00:00.000Z'), NOW);
    expect(result.snapshot?.updatedAt).toBe(NOW.toISOString());
  });

  it('si otro teléfono guardó justo antes, devuelve lo que quedó guardado', async () => {
    const mine = snapshot('2026-10-05T19:10:00.000Z');
    const theirs = snapshot('2026-10-05T19:20:00.000Z', 'plan');
    await service.save('ana', snapshot('2026-10-05T19:00:00.000Z'), NOW);
    // Entre la lectura y la escritura, el otro teléfono cambia la fila.
    const read = table.findUnique;
    table.findUnique = async (args) => {
      const row = await read(args);
      table.rows.set('ana', {
        userId: 'ana',
        data: theirs.progress,
        clientUpdatedAt: new Date(theirs.updatedAt),
      });
      table.findUnique = read;
      return row;
    };
    await expect(service.save('ana', mine, NOW)).resolves.toEqual({ snapshot: theirs });
  });

  it('lo guardado con un formato viejo se reemplaza', async () => {
    table.rows.set('ana', {
      userId: 'ana',
      data: { formato: 'viejo' },
      clientUpdatedAt: new Date('2026-10-05T19:59:00.000Z'),
    });
    const incoming = snapshot('2026-10-05T19:00:00.000Z');
    await expect(service.save('ana', incoming, NOW)).resolves.toEqual({ snapshot: incoming });
  });
});

describe('storedSnapshot y notInTheFuture', () => {
  it('ignora datos que ya no cumplen el formato', () => {
    expect(storedSnapshot({ data: { otra: 'cosa' }, clientUpdatedAt: NOW })).toBeNull();
  });

  it('deja igual una hora pasada', () => {
    const past = snapshot('2026-10-05T19:00:00.000Z');
    expect(notInTheFuture(past, NOW)).toBe(past);
  });
});
