import { useMemo } from 'react';

import { storage } from '@/db/storage';
import type { LessonInfo } from '@/features/catalog/catalog';
import { createStore, useStore } from '@/lib/store';

/**
 * Clases "ancladas": las que ya están en el teléfono y funcionan sin señal.
 *
 * Fase 1: la descarga es simulada (progreso falso) detrás de la misma interfaz
 * que tendrá la real. Fase 2: pedir enlaces firmados a POST /v1/lessons/:slug/download,
 * bajar cada archivo con expo-file-system y verificar su sha256 contra el manifest.
 */

export interface ActiveDownload {
  receivedBytes: number;
  totalBytes: number;
}

interface DownloadsState {
  /** slug → bytes en disco. */
  anchored: Record<string, number>;
  active: Record<string, ActiveDownload>;
  queue: string[];
}

const downloadsStore = createStore<DownloadsState>({ anchored: {}, active: {}, queue: [] });

export function loadDownloads(): void {
  const anchored = Object.fromEntries(
    storage.listDownloaded().map((row) => [row.lessonSlug, row.sizeBytes]),
  );
  downloadsStore.set((state) => ({ ...state, anchored }));
}

export function useDownloads(): DownloadsState {
  return useStore(downloadsStore);
}

export function isAnchored(
  lesson: Pick<LessonInfo, 'slug' | 'packaged'>,
  state = downloadsStore.get(),
): boolean {
  return lesson.packaged || state.anchored[lesson.slug] !== undefined;
}

/** Estado de anclaje de una clase para pintar su fila. */
export type AnchorStatus =
  | { kind: 'anchored' }
  | { kind: 'downloading'; progress: number; receivedBytes: number }
  | { kind: 'queued' }
  | { kind: 'remote' };

export function anchorStatus(lesson: LessonInfo, state: DownloadsState): AnchorStatus {
  if (isAnchored(lesson, state)) return { kind: 'anchored' };
  const active = state.active[lesson.slug];
  if (active) {
    return {
      kind: 'downloading',
      progress: active.receivedBytes / active.totalBytes,
      receivedBytes: active.receivedBytes,
    };
  }
  if (state.queue.includes(lesson.slug)) return { kind: 'queued' };
  return { kind: 'remote' };
}

export function useAnchorStatus(lesson: LessonInfo): AnchorStatus {
  const state = useDownloads();
  return useMemo(() => anchorStatus(lesson, state), [lesson, state]);
}

// ----- Descarga simulada -----

const TICK_MS = 200;
const BYTES_PER_TICK = 2.5 * 1024 * 1024;
let timer: ReturnType<typeof setInterval> | null = null;
const sizes = new Map<string, number>();

function step() {
  const state = downloadsStore.get();
  const [current, ...rest] = state.queue;
  if (!current) {
    if (timer) clearInterval(timer);
    timer = null;
    return;
  }
  const total = sizes.get(current) ?? 0;
  const received = Math.min(total, (state.active[current]?.receivedBytes ?? 0) + BYTES_PER_TICK);

  if (received >= total) {
    storage.upsertDownloaded({
      lessonSlug: current,
      locale: 'es',
      version: 1,
      localPath: `simulado://${current}`,
      sizeBytes: total,
      downloadedAt: new Date(),
    });
    const { [current]: _done, ...active } = state.active;
    downloadsStore.set({ anchored: { ...state.anchored, [current]: total }, active, queue: rest });
  } else {
    downloadsStore.set({
      ...state,
      active: { ...state.active, [current]: { receivedBytes: received, totalBytes: total } },
    });
  }
}

/** Pone clases en la cola para anclarlas. Sigue aunque se cierre la pantalla. */
export function anchorLessons(lessons: readonly LessonInfo[]): void {
  const state = downloadsStore.get();
  const pending = lessons.filter(
    (lesson) => !isAnchored(lesson, state) && !state.queue.includes(lesson.slug),
  );
  if (pending.length === 0) return;
  for (const lesson of pending) sizes.set(lesson.slug, lesson.packageBytes);
  downloadsStore.set({
    ...state,
    queue: [...state.queue, ...pending.map((lesson) => lesson.slug)],
  });
  if (!timer) timer = setInterval(step, TICK_MS);
}

/** Borra las clases descargadas. Las que vienen dentro de la app no se pueden borrar. */
export function removeAnchored(slugs: readonly string[]): void {
  for (const slug of slugs) storage.deleteDownloaded(slug);
  downloadsStore.set((state) => {
    const anchored = { ...state.anchored };
    for (const slug of slugs) delete anchored[slug];
    return { ...state, anchored };
  });
}

export function formatBytes(bytes: number, locale: string): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(mb / 1024)} GB`;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.max(1, mb))} MB`;
}
