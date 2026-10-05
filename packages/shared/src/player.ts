import {
  findTimelineProblems,
  type BreathPhase,
  type LessonTimeline,
  type TimelineSegment,
} from './timeline.js';

/**
 * Motor del reproductor de clases. No sabe nada de React, Expo ni relojes:
 * recibe el tiempo desde afuera (nowMs), así que es determinista y fácil de probar.
 * La app lo conecta a un reloj real, al video del instructor, a la voz y a la háptica.
 */

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'ended';

/** Velocidades que ofrece la tortuga del reproductor. */
export const PLAYBACK_RATES = [0.5, 0.75, 1] as const;

export interface BreathState {
  phase: BreathPhase;
  /** Inicio de la fase, en milisegundos de la clase. */
  startMs: number;
  durationMs: number;
  /** Avance de la fase entre 0 y 1. */
  progress: number;
}

export interface PlayerSnapshot {
  status: PlayerStatus;
  positionMs: number;
  rate: number;
  /** Avance de toda la clase entre 0 y 1. */
  progress: number;
  segmentIndex: number;
  segment: TimelineSegment;
  segmentElapsedMs: number;
  segmentProgress: number;
  caption: string | null;
  breath: BreathState | null;
}

export type PlayerEvent =
  | { type: 'segment-start'; atMs: number; index: number; segment: TimelineSegment }
  | { type: 'cue'; atMs: number; index: number; cue: string }
  | { type: 'breath'; atMs: number; index: number; phase: BreathPhase; durationMs: number }
  | { type: 'caption'; atMs: number; index: number; text: string }
  | { type: 'ended'; atMs: number };

export interface TimelinePlayer {
  readonly timeline: LessonTimeline;
  play(nowMs: number): void;
  pause(nowMs: number): void;
  seek(positionMs: number, nowMs: number): void;
  setRate(rate: number, nowMs: number): void;
  /** Avanza hasta nowMs: devuelve el estado y los eventos ocurridos desde el tick anterior. */
  tick(nowMs: number): { snapshot: PlayerSnapshot; events: PlayerEvent[] };
  snapshot(nowMs: number): PlayerSnapshot;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function assertRate(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0 || rate > 2) {
    throw new Error(`Velocidad inválida: ${rate}. Debe estar entre 0 y 2.`);
  }
  return rate;
}

/** Orden dentro del mismo milisegundo: primero el segmento, luego su audio, la respiración y el texto. */
const EVENT_ORDER: Record<PlayerEvent['type'], number> = {
  'segment-start': 0,
  cue: 1,
  breath: 2,
  caption: 3,
  ended: 4,
};

/** Todos los eventos de la línea de tiempo, ordenados. Se calcula una vez por clase. */
function collectEvents(timeline: LessonTimeline): PlayerEvent[] {
  const events: PlayerEvent[] = [];
  timeline.segments.forEach((segment, index) => {
    const start = segment.startMs;
    events.push({ type: 'segment-start', atMs: start, index, segment });
    if (segment.cue) events.push({ type: 'cue', atMs: start, index, cue: segment.cue });
    for (const breath of segment.breath) {
      events.push({
        type: 'breath',
        atMs: start + breath.atMs,
        index,
        phase: breath.phase,
        durationMs: breath.durationMs,
      });
    }
    for (const caption of segment.captions) {
      events.push({ type: 'caption', atMs: start + caption.atMs, index, text: caption.text });
    }
  });
  return events.sort((a, b) => a.atMs - b.atMs || EVENT_ORDER[a.type] - EVENT_ORDER[b.type]);
}

/** Estado de la clase en una posición dada. Función pura. */
export function snapshotAt(
  timeline: LessonTimeline,
  positionMs: number,
  status: PlayerStatus = 'paused',
  rate = 1,
): PlayerSnapshot {
  const total = timeline.totalDurationMs;
  const position = clamp(positionMs, 0, total);

  let segmentIndex = 0;
  timeline.segments.forEach((segment, index) => {
    if (segment.startMs <= position) segmentIndex = index;
  });
  const segment = timeline.segments[segmentIndex]!;
  const segmentElapsedMs = clamp(position - segment.startMs, 0, segment.durationMs);

  let caption: string | null = null;
  for (const item of segment.captions) {
    if (item.atMs <= segmentElapsedMs) caption = item.text;
  }

  let breath: BreathState | null = null;
  for (const item of segment.breath) {
    if (item.atMs <= segmentElapsedMs) {
      breath = {
        phase: item.phase,
        startMs: segment.startMs + item.atMs,
        durationMs: item.durationMs,
        progress: clamp((segmentElapsedMs - item.atMs) / item.durationMs, 0, 1),
      };
    }
  }

  return {
    status,
    positionMs: position,
    rate,
    progress: position / total,
    segmentIndex,
    segment,
    segmentElapsedMs,
    segmentProgress: segmentElapsedMs / segment.durationMs,
    caption,
    breath,
  };
}

export function createTimelinePlayer(
  timeline: LessonTimeline,
  options: { rate?: number } = {},
): TimelinePlayer {
  const problems = findTimelineProblems(timeline);
  if (problems.length > 0) {
    throw new Error(`Línea de tiempo inválida (${timeline.lessonSlug}): ${problems.join('; ')}`);
  }

  const total = timeline.totalDurationMs;
  const allEvents = collectEvents(timeline);
  let status: PlayerStatus = 'idle';
  let rate = assertRate(options.rate ?? 1);
  let anchorPosition = 0;
  let anchorNow = 0;
  /** Los eventos con atMs mayor que esto todavía no se han emitido. */
  let emittedUntil = -1;

  const positionAt = (nowMs: number) =>
    status === 'playing'
      ? clamp(anchorPosition + (nowMs - anchorNow) * rate, 0, total)
      : anchorPosition;

  return {
    timeline,

    play(nowMs) {
      if (status === 'playing') return;
      if (status === 'ended') {
        anchorPosition = 0;
        emittedUntil = -1;
      }
      status = 'playing';
      anchorNow = nowMs;
    },

    pause(nowMs) {
      if (status !== 'playing') return;
      anchorPosition = positionAt(nowMs);
      status = 'paused';
    },

    seek(positionMs, nowMs) {
      anchorPosition = clamp(positionMs, 0, total);
      anchorNow = nowMs;
      // Lo que ocurre justo en el punto de destino se vuelve a emitir (por ejemplo, su subtítulo).
      emittedUntil = anchorPosition - 1;
      if (status === 'ended' || status === 'idle') status = 'paused';
    },

    setRate(nextRate, nowMs) {
      assertRate(nextRate);
      if (status === 'playing') {
        anchorPosition = positionAt(nowMs);
        anchorNow = nowMs;
      }
      rate = nextRate;
    },

    tick(nowMs) {
      const events: PlayerEvent[] = [];
      if (status === 'playing') {
        const position = positionAt(nowMs);
        for (const event of allEvents) {
          if (event.atMs > emittedUntil && event.atMs <= position) events.push(event);
        }
        emittedUntil = Math.max(emittedUntil, position);
        if (position >= total) {
          anchorPosition = total;
          status = 'ended';
          events.push({ type: 'ended', atMs: total });
        }
      }
      return { snapshot: snapshotAt(timeline, positionAt(nowMs), status, rate), events };
    },

    snapshot(nowMs) {
      return snapshotAt(timeline, positionAt(nowMs), status, rate);
    },
  };
}

/** 125000 → "2:05". */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
