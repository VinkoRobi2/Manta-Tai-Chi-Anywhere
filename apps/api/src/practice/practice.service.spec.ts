import type { PracticeSession } from '@manta/shared';
import type { PrismaService } from '../prisma/prisma.service.js';
import { notInTheFuture, PracticeService } from './practice.service.js';

interface Row {
  id: string;
  userId: string;
  lessonSlug: string;
  completedAt: Date;
  durationSec: number;
  mood: PracticeSession['mood'];
  spaceMode: PracticeSession['spaceMode'];
}

/** La tabla PracticeSession en memoria, con las mismas reglas que la base de datos. */
class FakePracticeTable {
  rows = new Map<string, Row>();

  createMany = async ({ data }: { data: Row[]; skipDuplicates: boolean }) => {
    let count = 0;
    for (const row of data) {
      if (this.rows.has(row.id)) continue;
      this.rows.set(row.id, row);
      count += 1;
    }
    return { count };
  };

  findMany = async ({ where }: { where: { userId: string; id?: { in: string[] } } }) =>
    [...this.rows.values()]
      .filter((row) => row.userId === where.userId && (!where.id || where.id.in.includes(row.id)))
      .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
}

const NOW = new Date('2026-10-08T20:00:00.000Z');

function session(id: string, completedAt: string, mood: PracticeSession['mood'] = 'CALM') {
  return {
    id,
    lessonSlug: 'sentado-manos-de-nube',
    completedAt,
    durationSec: 480,
    mood,
    spaceMode: 'SEATED',
  } satisfies PracticeSession;
}

const A = '3f2b8c1e-6a4d-4f7e-9b2a-1c3d5e7f9a0b';
const B = '9c4e1d2f-3b5a-4c6d-8e7f-0a1b2c3d4e5f';

describe('PracticeService', () => {
  let table: FakePracticeTable;
  let service: PracticeService;

  beforeEach(() => {
    table = new FakePracticeTable();
    service = new PracticeService({ practiceSession: table } as unknown as PrismaService);
  });

  it('guarda las prácticas y las devuelve en orden', async () => {
    const result = await service.upload(
      'ana',
      [session(B, '2026-10-08T09:00:00.000Z', null), session(A, '2026-10-07T09:00:00.000Z')],
      NOW,
    );
    expect(result.saved.sort()).toEqual([A, B].sort());
    const { sessions } = await service.list('ana');
    expect(sessions.map((item) => item.id)).toEqual([A, B]);
    expect(sessions[1]).toEqual(session(B, '2026-10-08T09:00:00.000Z', null));
  });

  it('subir dos veces la misma práctica no la duplica', async () => {
    await service.upload('ana', [session(A, '2026-10-07T09:00:00.000Z')], NOW);
    const again = await service.upload('ana', [session(A, '2026-10-07T09:00:00.000Z')], NOW);
    expect(again.saved).toEqual([A]);
    expect(table.rows.size).toBe(1);
  });

  it('un id que ya usa otra persona no se confirma ni se mezcla', async () => {
    await service.upload('ana', [session(A, '2026-10-07T09:00:00.000Z')], NOW);
    const other = await service.upload('luis', [session(A, '2026-10-07T10:00:00.000Z')], NOW);
    expect(other.saved).toEqual([]);
    await expect(service.list('luis')).resolves.toEqual({ sessions: [] });
  });

  it('una práctica con fecha en el futuro queda en "ahora"', async () => {
    await service.upload('ana', [session(A, '2027-01-01T00:00:00.000Z')], NOW);
    const { sessions } = await service.list('ana');
    expect(sessions[0]?.completedAt).toBe(NOW.toISOString());
  });
});

describe('notInTheFuture', () => {
  it('deja igual las fechas pasadas', () => {
    const past = new Date('2026-10-01T00:00:00.000Z');
    expect(notInTheFuture(past, NOW)).toBe(past);
  });
});
