import {
  newerSnapshot,
  ProgressSnapshotSchema,
  type OnboardingProgress,
  type ProgressSnapshot,
} from '@manta/shared';
import { addNetworkStateListener } from 'expo-network';

import { storage } from '@/db/storage';
import { api, ApiError } from '@/lib/api';

/**
 * El progreso vive primero en el teléfono: se guarda al momento, con o sin internet.
 * Con cuenta, se sube a la nube en cuanto hay señal y se recupera al entrar en otro teléfono.
 * Si dos versiones chocan, gana la que se cambió más tarde.
 */

const KEY = 'progress';
/** Espera tras un cambio antes de subirlo: varios toques seguidos viajan en una sola subida. */
const SYNC_DELAY_MS = 1500;

interface LocalProgress {
  snapshot: ProgressSnapshot;
  /** De quién es: el id de la cuenta, o null si se hizo como invitado. */
  owner: string | null;
  /** updatedAt de la última versión que confirmó la nube. Si no coincide, hay algo por subir. */
  syncedAt: string | null;
}

/** La cuenta con la que se sincroniza. Sin cuenta (invitado), todo se queda en el teléfono. */
export interface SyncAccount {
  userId: string;
  token: string;
  /** La nube rechazó la sesión (caducó o la cuenta ya no existe). */
  onRejected: () => void;
}

let local: LocalProgress | null = null;
let account: SyncAccount | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let queue: Promise<void> = Promise.resolve();
const replacedListeners = new Set<() => void>();

/** Lee el progreso guardado. Se llama una vez al abrir la app. */
export function loadProgress(): void {
  local = parseLocal(storage.readSettings()[KEY]);
}

function parseLocal(raw: string | undefined): LocalProgress | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Record<keyof LocalProgress, unknown>> | null;
    const snapshot = ProgressSnapshotSchema.safeParse(value?.snapshot);
    if (!snapshot.success) return null;
    return {
      snapshot: snapshot.data,
      owner: typeof value?.owner === 'string' ? value.owner : null,
      syncedAt: typeof value?.syncedAt === 'string' ? value.syncedAt : null,
    };
  } catch {
    return null;
  }
}

function persist(next: LocalProgress | null): void {
  local = next;
  storage.writeSetting(KEY, JSON.stringify(next));
}

/** Avisa cuando llega de la nube una versión más reciente (por ejemplo, de otro teléfono). */
export function onProgressReplaced(listener: () => void): () => void {
  replacedListeners.add(listener);
  return () => replacedListeners.delete(listener);
}

export function getOnboardingProgress(): OnboardingProgress | null {
  return local?.snapshot.progress.onboarding ?? null;
}

/** Guarda al momento en el teléfono y, con cuenta, programa la subida. */
export function saveOnboardingProgress(onboarding: OnboardingProgress): void {
  persist({
    snapshot: { progress: { onboarding }, updatedAt: new Date().toISOString() },
    owner: local?.owner ?? account?.userId ?? null,
    syncedAt: local?.syncedAt ?? null,
  });
  scheduleSync(SYNC_DELAY_MS);
}

/** Borra el progreso del teléfono (no el de la nube) y deja de sincronizar. */
export function clearProgress(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  account = null;
  persist(null);
}

/** Con cuenta, sube lo pendiente; con null (invitado), deja de sincronizar. */
export function setSyncAccount(next: SyncAccount | null): void {
  account = next;
  if (next) scheduleSync(0);
}

/**
 * Al entrar con una cuenta, el progreso del teléfono (de invitado o de esa misma cuenta) se junta
 * con el de la nube y gana el más reciente. Si era de otra cuenta no se mezcla: manda la nube.
 * Sin señal no falla: se juntan cuando vuelva.
 */
export async function adoptProgress(next: SyncAccount): Promise<void> {
  account = next;
  if (local?.owner && local.owner !== next.userId) persist(null);
  else if (local) persist({ ...local, owner: next.userId });
  await runSync();
}

/** Cuando vuelve la señal, sube lo pendiente. Se llama una vez al abrir la app. */
export function startProgressSync(): void {
  addNetworkStateListener(({ isConnected, isInternetReachable }) => {
    if (isConnected && isInternetReachable !== false) scheduleSync(0);
  });
}

function scheduleSync(delay: number): void {
  if (!account) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void runSync();
  }, delay);
}

/** Las sincronizaciones van en fila: nunca dos a la vez. */
function runSync(): Promise<void> {
  queue = queue.then(syncOnce).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      account?.onRejected();
      account = null;
    }
    // Sin señal o con la API caída: se reintenta con el próximo cambio o cuando vuelva la conexión.
  });
  return queue;
}

async function syncOnce(): Promise<void> {
  const current = account;
  if (!current) return;
  const pending = local && local.syncedAt !== local.snapshot.updatedAt ? local.snapshot : null;
  const { snapshot: cloud } = pending
    ? await api.putProgress(current.token, pending)
    : await api.getProgress(current.token);
  // Si cambió la cuenta mientras tanto, la respuesta ya no sirve.
  if (account !== current) return;

  if (!cloud) {
    // La nube no tiene nada: lo del teléfono se sube en la próxima vuelta.
    if (local) {
      persist({ ...local, syncedAt: null });
      scheduleSync(0);
    }
    return;
  }

  const mine = local?.snapshot ?? null;
  const same = mine !== null && JSON.stringify(mine.progress) === JSON.stringify(cloud.progress);
  if (mine && !same && newerSnapshot(cloud, mine) === mine) {
    // Hubo un cambio en el teléfono mientras viajaba la respuesta: se sube en la próxima vuelta.
    persist({ snapshot: mine, owner: current.userId, syncedAt: cloud.updatedAt });
    scheduleSync(0);
  } else {
    persist({ snapshot: cloud, owner: current.userId, syncedAt: cloud.updatedAt });
    if (!same) replacedListeners.forEach((listener) => listener());
  }
}
