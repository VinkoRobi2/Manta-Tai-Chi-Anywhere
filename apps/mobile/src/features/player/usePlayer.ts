import {
  createTimelinePlayer,
  type LessonTimeline,
  type PlayerEvent,
  type PlayerSnapshot,
} from '@manta/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const TICK_MS = 100;

export interface PlayerControls {
  snapshot: PlayerSnapshot;
  play(): void;
  pause(): void;
  toggle(): void;
  seekBy(deltaMs: number): void;
  setRate(rate: number): void;
  /** Tiempo real practicado (con pausas descontadas), en milisegundos. */
  practicedMs(): number;
}

/**
 * Conecta el motor puro de @manta/shared con un reloj real.
 * Los eventos (subtítulo, respiración, fin) llegan a onEvent; el estado se vuelve a pintar 10 veces por segundo.
 */
export function usePlayer(
  timeline: LessonTimeline,
  onEvent: (event: PlayerEvent, snapshot: PlayerSnapshot) => void,
): PlayerControls {
  const engine = useMemo(() => createTimelinePlayer(timeline), [timeline]);
  const [snapshot, setSnapshot] = useState(() => engine.snapshot(Date.now()));

  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const practiced = useRef({ total: 0, lastTick: 0 });

  const tick = useCallback(() => {
    const now = Date.now();
    const before = engine.snapshot(now);
    if (before.status === 'playing' && practiced.current.lastTick > 0) {
      practiced.current.total += now - practiced.current.lastTick;
    }
    practiced.current.lastTick = before.status === 'playing' ? now : 0;

    const result = engine.tick(now);
    for (const event of result.events) onEventRef.current(event, result.snapshot);
    setSnapshot(result.snapshot);
  }, [engine]);

  useEffect(() => {
    if (snapshot.status !== 'playing') return;
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [snapshot.status, tick]);

  return useMemo(() => {
    const play = () => {
      engine.play(Date.now());
      practiced.current.lastTick = Date.now();
      tick();
    };
    const pause = () => {
      tick();
      engine.pause(Date.now());
      practiced.current.lastTick = 0;
      tick();
    };
    return {
      snapshot,
      play,
      pause,
      toggle: () => (engine.snapshot(Date.now()).status === 'playing' ? pause() : play()),
      seekBy: (deltaMs: number) => {
        const now = Date.now();
        engine.seek(engine.snapshot(now).positionMs + deltaMs, now);
        tick();
      },
      setRate: (rate: number) => {
        engine.setRate(rate, Date.now());
        tick();
      },
      practicedMs: () => practiced.current.total,
    };
  }, [engine, snapshot, tick]);
}
