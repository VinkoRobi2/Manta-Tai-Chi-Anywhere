import { describe, expect, it } from 'vitest';
import { buildTimeline, type MovementScript } from './lesson-builder.js';

const same = <T>(value: T) => ({ es: value, en: value, de: value });

const LIBRARY: Record<string, MovementScript> = {
  comienzo: {
    id: 'comienzo',
    clip: 'comienzo.mp4',
    title: { es: 'Comienzo', en: 'Commencement', de: 'Eröffnung' },
    intro: same('Intro'),
    cues: same(['Uno', 'Dos']),
    breath: { inMs: 4_000, outMs: 5_000 },
  },
  cierre: {
    id: 'cierre',
    clip: 'cierre.mp4',
    title: same('Cierre'),
    intro: same('Cierra'),
    cues: same([]),
    breath: { inMs: 5_000, outMs: 5_000 },
  },
};

describe('buildTimeline', () => {
  const timeline = buildTimeline(
    { slug: 'demo', movements: [{ id: 'comienzo', durationSec: 60 }, { id: 'cierre', durationSec: 20 }] },
    LIBRARY,
    'en',
  );

  it('encadena los segmentos sin huecos', () => {
    expect(timeline.totalDurationMs).toBe(80_000);
    expect(timeline.segments.map((segment) => segment.startMs)).toEqual([0, 60_000]);
    expect(timeline.segments[0]!.title).toBe('Commencement');
  });

  it('alterna las indicaciones después de la introducción', () => {
    expect(timeline.segments[0]!.captions.map((caption) => caption.text)).toEqual(['Intro', 'Uno', 'Dos', 'Uno']);
  });

  it('alterna inhalar y exhalar dentro del segmento', () => {
    const phases = timeline.segments[0]!.breath.map((breath) => breath.phase);
    expect(phases.slice(0, 4)).toEqual(['in', 'out', 'in', 'out']);
    const last = timeline.segments[0]!.breath.at(-1)!;
    expect(last.atMs + last.durationMs).toBeLessThanOrEqual(60_000);
  });

  it('falla con un movimiento que no existe', () => {
    expect(() => buildTimeline({ slug: 'x', movements: [{ id: 'nada', durationSec: 10 }] }, LIBRARY, 'es')).toThrow(
      /desconocido/,
    );
  });
});
