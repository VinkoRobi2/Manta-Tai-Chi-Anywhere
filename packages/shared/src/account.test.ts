import { describe, expect, it } from 'vitest';
import {
  AppleSignInSchema,
  newerSnapshot,
  ProgressSnapshotSchema,
  type ProgressSnapshot,
} from './account.js';

const snapshot = (updatedAt: string, completed = false): ProgressSnapshot => ({
  updatedAt,
  progress: {
    onboarding: {
      screen: completed ? 'plan' : 'sentir',
      completed,
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
});

describe('ProgressSnapshotSchema', () => {
  it('acepta un progreso válido', () => {
    expect(ProgressSnapshotSchema.safeParse(snapshot('2026-10-05T18:00:00.000Z')).success).toBe(
      true,
    );
  });

  it('rechaza más de dos objetivos, minutos fuera de la lista y pantallas que no existen', () => {
    const valid = snapshot('2026-10-05T18:00:00.000Z');
    const answers = valid.progress.onboarding.answers;
    const withAnswers = (patch: object) => ({
      ...valid,
      progress: { onboarding: { ...valid.progress.onboarding, answers: { ...answers, ...patch } } },
    });
    expect(
      ProgressSnapshotSchema.safeParse(withAnswers({ goals: ['calm', 'sleep', 'energy'] })).success,
    ).toBe(false);
    expect(ProgressSnapshotSchema.safeParse(withAnswers({ dailyMinutes: 15 })).success).toBe(false);
    expect(
      ProgressSnapshotSchema.safeParse({
        ...valid,
        progress: { onboarding: { ...valid.progress.onboarding, screen: 'clases' } },
      }).success,
    ).toBe(false);
  });

  it('exige la hora en formato ISO', () => {
    expect(ProgressSnapshotSchema.safeParse(snapshot('ayer')).success).toBe(false);
  });
});

describe('newerSnapshot', () => {
  const older = snapshot('2026-10-05T18:00:00.000Z');
  const newer = snapshot('2026-10-05T18:05:00.000Z', true);

  it('sin nada guardado, gana lo que llega', () => {
    expect(newerSnapshot(null, older)).toBe(older);
  });

  it('gana la versión cambiada más tarde, venga de donde venga', () => {
    expect(newerSnapshot(older, newer)).toBe(newer);
    expect(newerSnapshot(newer, older)).toBe(newer);
  });

  it('si empatan, se queda la guardada', () => {
    const same = snapshot('2026-10-05T18:00:00.000Z', true);
    expect(newerSnapshot(older, same)).toBe(older);
  });
});

describe('AppleSignInSchema', () => {
  it('el nombre es opcional y se recorta', () => {
    expect(AppleSignInSchema.parse({ identityToken: 'a.b.c' }).fullName).toBeUndefined();
    expect(AppleSignInSchema.parse({ identityToken: 'a.b.c', fullName: '  Ana  ' }).fullName).toBe(
      'Ana',
    );
  });
});
