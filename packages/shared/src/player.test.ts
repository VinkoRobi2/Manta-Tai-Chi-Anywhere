import { describe, expect, it } from 'vitest';
import { createTimelinePlayer, formatClock, snapshotAt, type PlayerEvent } from './player.js';
import { LessonTimelineSchema, parseTimeline, type LessonTimelineInput } from './timeline.js';

const INPUT: LessonTimelineInput = {
  schemaVersion: 1,
  lessonSlug: 'prueba',
  locale: 'es',
  totalDurationMs: 20_000,
  segments: [
    {
      title: 'Comienzo',
      clip: 'comienzo.mp4',
      startMs: 0,
      durationMs: 8_000,
      cue: 'voz/01.m4a',
      captions: [
        { atMs: 0, text: 'Siéntate cómodo' },
        { atMs: 4_000, text: 'Sube los brazos' },
      ],
      breath: [
        { atMs: 1_000, phase: 'in', durationMs: 3_000 },
        { atMs: 4_000, phase: 'out', durationMs: 4_000 },
      ],
    },
    {
      title: 'Manos de nube',
      clip: 'manos.mp4',
      startMs: 8_000,
      durationMs: 12_000,
      captions: [{ atMs: 0, text: 'Las manos flotan' }],
      breath: [{ atMs: 0, phase: 'in', durationMs: 5_000 }],
    },
  ],
};
const TIMELINE = parseTimeline(INPUT);

const types = (events: PlayerEvent[]) => events.map((event) => event.type);

describe('snapshotAt', () => {
  it('ubica segmento, subtítulo y respiración', () => {
    const snap = snapshotAt(TIMELINE, 5_500);
    expect(snap.segmentIndex).toBe(0);
    expect(snap.caption).toBe('Sube los brazos');
    expect(snap.breath).toMatchObject({ phase: 'out', progress: 0.375 });
    expect(snap.progress).toBeCloseTo(0.275);
  });

  it('cambia de segmento justo en su inicio', () => {
    const snap = snapshotAt(TIMELINE, 8_000);
    expect(snap.segmentIndex).toBe(1);
    expect(snap.segment.title).toBe('Manos de nube');
    expect(snap.caption).toBe('Las manos flotan');
  });

  it('no inventa respiración antes de la primera fase', () => {
    expect(snapshotAt(TIMELINE, 500).breath).toBeNull();
  });
});

describe('createTimelinePlayer', () => {
  it('no emite nada antes de dar play', () => {
    const player = createTimelinePlayer(TIMELINE);
    expect(player.tick(1_000).events).toEqual([]);
    expect(player.snapshot(1_000).status).toBe('idle');
  });

  it('emite los eventos del inicio en orden', () => {
    const player = createTimelinePlayer(TIMELINE);
    player.play(0);
    expect(types(player.tick(0).events)).toEqual(['segment-start', 'cue', 'caption']);
  });

  it('cruza el límite entre segmentos', () => {
    const player = createTimelinePlayer(TIMELINE);
    player.play(0);
    player.tick(7_000);
    const { snapshot, events } = player.tick(8_500);
    expect(snapshot.segmentIndex).toBe(1);
    expect(types(events)).toEqual(['segment-start', 'breath', 'caption']);
  });

  it('pausa y retoma sin perder la posición', () => {
    const player = createTimelinePlayer(TIMELINE);
    player.play(0);
    player.pause(3_000);
    expect(player.tick(10_000).snapshot.positionMs).toBe(3_000);
    player.play(10_000);
    expect(player.tick(11_000).snapshot.positionMs).toBe(4_000);
  });

  it('al retroceder vuelve a emitir lo que ocurre en el destino', () => {
    const player = createTimelinePlayer(TIMELINE);
    player.play(0);
    player.tick(12_000);
    player.seek(4_000, 12_000);
    const { snapshot, events } = player.tick(12_000);
    expect(snapshot.positionMs).toBe(4_000);
    expect(snapshot.caption).toBe('Sube los brazos');
    expect(types(events)).toEqual(['breath', 'caption']);
  });

  it('respeta el cambio de velocidad a mitad de segmento', () => {
    const player = createTimelinePlayer(TIMELINE);
    player.play(0);
    player.setRate(0.5, 2_000);
    expect(player.tick(6_000).snapshot.positionMs).toBe(4_000);
    player.setRate(1, 6_000);
    expect(player.tick(7_000).snapshot.positionMs).toBe(5_000);
  });

  it('termina una sola vez y se puede volver a empezar', () => {
    const player = createTimelinePlayer(TIMELINE);
    player.play(0);
    const end = player.tick(25_000);
    expect(end.snapshot.status).toBe('ended');
    expect(types(end.events).filter((type) => type === 'ended')).toHaveLength(1);
    expect(player.tick(30_000).events).toEqual([]);
    player.play(30_000);
    expect(player.tick(30_000).snapshot.positionMs).toBe(0);
  });

  it('rechaza velocidades imposibles', () => {
    expect(() => createTimelinePlayer(TIMELINE, { rate: 0 })).toThrow();
    expect(() => createTimelinePlayer(TIMELINE).setRate(3, 0)).toThrow();
  });
});

describe('líneas de tiempo inválidas', () => {
  it('detecta segmentos que se solapan', () => {
    const overlapping = structuredClone(INPUT);
    overlapping.segments[1]!.startMs = 6_000;
    expect(() => parseTimeline(overlapping)).toThrow(/antes de que termine/);
  });

  it('detecta subtítulos fuera de su segmento', () => {
    const broken = structuredClone(INPUT);
    broken.segments[0]!.captions = [{ atMs: 9_000, text: 'tarde' }];
    expect(() => parseTimeline(broken)).toThrow(/subtítulo fuera/);
  });

  it('el motor rechaza una línea de tiempo que no valida', () => {
    const broken = LessonTimelineSchema.parse({ ...INPUT, totalDurationMs: 10_000 });
    expect(() => createTimelinePlayer(broken)).toThrow(/totalDurationMs/);
  });
});

describe('formatClock', () => {
  it('formatea minutos y segundos', () => {
    expect(formatClock(125_000)).toBe('2:05');
    expect(formatClock(0)).toBe('0:00');
  });
});
