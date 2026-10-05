import type { SeaState, SpaceMode } from '@manta/shared';

import { storage } from '@/db/storage';
import type { SessionRow } from '@/db/types';
import { getSettings, updateSettings } from '@/features/settings/settings';
import { createStore, useStore } from '@/lib/store';

/** Bitácora local: cada práctica queda en el teléfono. */

const sessionsStore = createStore<SessionRow[]>([]);

export function loadSessions(): void {
  sessionsStore.set(storage.listSessions());
}

export function useSessions(): SessionRow[] {
  return useStore(sessionsStore);
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export interface SessionInput {
  lessonSlug: string;
  durationSec: number;
  spaceMode: SpaceMode;
  careTags: string[];
}

export function recordSession(input: SessionInput): SessionRow {
  const session: SessionRow = { id: newId(), completedAt: new Date(), mood: null, ...input };
  storage.insertSession(session);
  sessionsStore.set((current) => [session, ...current]);

  const settings = getSettings();
  updateSettings({
    sessionsCompleted: settings.sessionsCompleted + 1,
    firstLessonCompletedAt: settings.firstLessonCompletedAt ?? session.completedAt.toISOString(),
  });
  return session;
}

export function setSessionMood(id: string, mood: SeaState | null): void {
  storage.updateSessionMood(id, mood);
  sessionsStore.set((current) => current.map((row) => (row.id === id ? { ...row, mood } : row)));
}
