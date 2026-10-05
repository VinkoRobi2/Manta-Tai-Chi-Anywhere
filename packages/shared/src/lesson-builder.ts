import type { Locale } from './enums.js';
import {
  parseTimeline,
  type LessonTimeline,
  type TimelineBreath,
  type TimelineCaption,
} from './timeline.js';

/**
 * Herramienta del pipeline de contenido: arma la línea de tiempo de una clase
 * a partir de guiones de movimientos. La app no la usa; solo lee el resultado.
 */

export type Localized<T> = Record<Locale, T>;

export interface MovementScript {
  id: string;
  /** Video del instructor de frente. */
  clip: string;
  clipSide?: string;
  title: Localized<string>;
  /** Primera indicación del movimiento. */
  intro: Localized<string>;
  /** Indicaciones que se van alternando mientras dura el movimiento. */
  cues: Localized<string[]>;
  /** Ritmo de respiración del movimiento. */
  breath: { inMs: number; outMs: number };
}

export interface LessonRecipe {
  slug: string;
  movements: { id: string; durationSec: number }[];
}

export interface BuildOptions {
  /** Cada cuánto cambia el subtítulo. */
  captionEveryMs?: number;
  /** Pausa antes de la primera respiración, para escuchar la indicación inicial. */
  breathLeadInMs?: number;
}

export function buildTimeline(
  recipe: LessonRecipe,
  library: Readonly<Record<string, MovementScript>>,
  locale: Locale,
  options: BuildOptions = {},
): LessonTimeline {
  const captionEveryMs = options.captionEveryMs ?? 18_000;
  const breathLeadInMs = options.breathLeadInMs ?? 3_000;
  let cursor = 0;

  const segments = recipe.movements.map(({ id, durationSec }) => {
    const movement = library[id];
    if (!movement) throw new Error(`Movimiento desconocido en ${recipe.slug}: ${id}`);
    const durationMs = durationSec * 1000;

    const captions: TimelineCaption[] = [{ atMs: 0, text: movement.intro[locale] }];
    const cues = movement.cues[locale];
    for (
      let at = captionEveryMs, i = 0;
      cues.length > 0 && at < durationMs - 4_000;
      at += captionEveryMs, i++
    ) {
      captions.push({ atMs: at, text: cues[i % cues.length]! });
    }

    const breath: TimelineBreath[] = [];
    for (let at = breathLeadInMs, inhale = true; at < durationMs - 1_000; inhale = !inhale) {
      const phaseMs = inhale ? movement.breath.inMs : movement.breath.outMs;
      breath.push({
        atMs: at,
        phase: inhale ? 'in' : 'out',
        durationMs: Math.min(phaseMs, durationMs - at),
      });
      at += phaseMs;
    }

    const segment = {
      title: movement.title[locale],
      clip: movement.clip,
      ...(movement.clipSide ? { clipSide: movement.clipSide } : {}),
      startMs: cursor,
      durationMs,
      playbackRate: 1,
      mirrorable: true,
      captions,
      breath,
    };
    cursor += durationMs;
    return segment;
  });

  return parseTimeline({
    schemaVersion: 1,
    lessonSlug: recipe.slug,
    locale,
    totalDurationMs: cursor,
    segments,
  });
}
