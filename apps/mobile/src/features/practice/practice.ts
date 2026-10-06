import {
  MAX_PRACTICE_BATCH,
  toPracticeRecord,
  type PracticeRecord,
  type PracticeSession,
  type SeaState,
  type SpaceMode,
} from '@manta/shared';
import { randomUUID } from 'expo-crypto';
import { addNetworkStateListener } from 'expo-network';

import { storage } from '@/db/storage';
import type { StoredPractice } from '@/db/types';
import type { SyncAccount } from '@/features/progress/progress';
import { api, ApiError } from '@/lib/api';
import { createStore, useStore } from '@/lib/store';

/**
 * Las prácticas terminadas. Se guardan al momento en el teléfono, con o sin internet, y con
 * cuenta se suben a la nube en cuanto hay señal. Al entrar con una cuenta en otro teléfono,
 * las de la nube se suman a las del teléfono: nunca se pierde ni se duplica ninguna.
 */

export type Practice = StoredPractice;
export type PracticeEntry = PracticeRecord & { id: string; lessonSlug: string };

const practicesStore = createStore<Practice[]>([]);
/** De qué cuenta son las prácticas del teléfono; sin dueño son de invitado. */
const OWNER_KEY = 'practicesOwner';

let account: SyncAccount | null = null;
let queue: Promise<void> = Promise.resolve();

/** Lee las prácticas guardadas. Se llama una vez al abrir la app. */
export function loadPractices(): void {
  practicesStore.set(storage.readPractices());
}

export function usePractices(): Practice[] {
  return useStore(practicesStore);
}

/** Las prácticas listas para las cuentas de progreso (fechas como Date). */
export function toEntries(practices: readonly Practice[]): PracticeEntry[] {
  return practices.map((practice) => ({ id: practice.id, ...toPracticeRecord(practice) }));
}

export interface NewPractice {
  lessonSlug: string;
  durationSec: number;
  mood: SeaState | null;
  spaceMode: SpaceMode;
  completedAt?: Date;
}

/** Guarda una práctica terminada y, con cuenta, la sube. */
export function recordPractice(input: NewPractice): Practice {
  const practice: Practice = {
    id: randomUUID(),
    lessonSlug: input.lessonSlug,
    completedAt: (input.completedAt ?? new Date()).toISOString(),
    durationSec: Math.max(1, Math.round(input.durationSec)),
    mood: input.mood,
    spaceMode: input.spaceMode,
    synced: false,
  };
  storage.insertPractices([practice]);
  practicesStore.set(storage.readPractices());
  void syncPractices();
  return practice;
}

/** Borra las prácticas del teléfono (no las de la nube). */
export function clearPractices(): void {
  storage.clearPractices();
  storage.writeSetting(OWNER_KEY, '');
  practicesStore.set([]);
}

/** Con cuenta, sube lo pendiente; con null (invitado), deja de sincronizar. */
export function setPracticeAccount(next: SyncAccount | null): void {
  account = next;
  if (next) void syncPractices();
}

/**
 * Al entrar con una cuenta: trae las prácticas de la nube y sube las del teléfono.
 * Las de invitado pasan a la cuenta; las de otra cuenta no se mezclan, se quedan en su nube.
 */
export function adoptPractices(next: SyncAccount): Promise<void> {
  const owner = storage.readSettings()[OWNER_KEY];
  if (owner && owner !== next.userId) clearPractices();
  storage.writeSetting(OWNER_KEY, next.userId);
  account = next;
  return syncPractices({ pull: true });
}

/** Cuando vuelve la señal, sube lo pendiente. Se llama una vez al abrir la app. */
export function startPracticeSync(): void {
  addNetworkStateListener(({ isConnected, isInternetReachable }) => {
    if (isConnected && isInternetReachable !== false) void syncPractices();
  });
}

/** Las subidas van en fila: nunca dos a la vez. Sin señal no falla: se reintenta después. */
function syncPractices(options: { pull?: boolean } = {}): Promise<void> {
  queue = queue
    .then(() => syncOnce(options.pull ?? false))
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        account?.onRejected();
        account = null;
      }
    });
  return queue;
}

async function syncOnce(pull: boolean): Promise<void> {
  const current = account;
  if (!current) return;

  if (pull) {
    const { sessions } = await api.getPractices(current.token);
    if (account !== current) return;
    storage.insertPractices(sessions.map((session) => ({ ...session, synced: true })));
    // Si ya existían en el teléfono, ahora también constan en la nube.
    storage.markPracticesSynced(sessions.map((session) => session.id));
    practicesStore.set(storage.readPractices());
  }

  let pending = storage.readPractices().filter((practice) => !practice.synced);
  while (pending.length > 0 && account === current) {
    const batch: PracticeSession[] = pending
      .slice(0, MAX_PRACTICE_BATCH)
      .map(({ synced: _synced, ...session }) => session);
    const { saved } = await api.putPractices(current.token, batch);
    storage.markPracticesSynced(saved);
    practicesStore.set(storage.readPractices());
    // Si la nube no confirmó ninguna, no se insiste en esta vuelta.
    if (saved.length === 0) break;
    pending = pending.slice(batch.length);
  }
}
