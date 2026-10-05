import {
  addNetworkStateListener,
  getNetworkStateAsync,
  NetworkStateType,
  type NetworkState,
} from 'expo-network';

import { getLessons } from '@/features/catalog/catalog';
import { getSettings } from '@/features/settings/settings';
import { currentLocale } from '@/lib/i18n';

import { anchorLessons } from './downloads';

/**
 * Anclaje automático: si la persona dijo en el onboarding que practica sin internet,
 * las clases gratis se descargan solas cada vez que el teléfono está con Wi-Fi.
 * Nunca con datos móviles.
 */

function onWifi(state: NetworkState): boolean {
  return state.type === NetworkStateType.WIFI && state.isInternetReachable !== false;
}

function anchorFreeLessons(): void {
  const free = getLessons(currentLocale()).filter(
    (lesson) => !lesson.isPremium && !lesson.packaged,
  );
  anchorLessons(free);
}

/** Ancla las clases gratis si está activado y hay Wi-Fi ahora mismo. */
export async function anchorFreeLessonsOnWifi(): Promise<void> {
  if (!getSettings().autoAnchorFree) return;
  try {
    if (onWifi(await getNetworkStateAsync())) anchorFreeLessons();
  } catch {
    // Sin información de red: se intenta la próxima vez que cambie la conexión.
  }
}

let subscription: ReturnType<typeof addNetworkStateListener> | null = null;

/** Se llama una vez al abrir la app: revisa ahora y cada vez que el teléfono se conecta a una red. */
export function watchWifiForAutoAnchor(): void {
  if (subscription) return;
  void anchorFreeLessonsOnWifi();
  subscription = addNetworkStateListener((state) => {
    if (getSettings().autoAnchorFree && onWifi(state)) anchorFreeLessons();
  });
}
