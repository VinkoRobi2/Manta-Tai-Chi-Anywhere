import type { SeaState } from '@manta/shared';
import * as StoreReview from 'expo-store-review';

import { getSettings, updateSettings } from '@/features/settings/settings';
import { track } from '@/lib/analytics';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Pide la reseña en la tienda solo en un buen momento: desde la tercera clase,
 * cuando la persona dijo que su mar está en calma, y como máximo cada 90 días.
 */
export async function maybeAskForReview(mood: SeaState): Promise<void> {
  const { sessionsCompleted, lastReviewAskAt } = getSettings();
  if (mood !== 'CALM' || sessionsCompleted < 3) return;
  if (lastReviewAskAt && Date.now() - new Date(lastReviewAskAt).getTime() < NINETY_DAYS_MS) return;
  try {
    if (!(await StoreReview.hasAction())) return;
    updateSettings({ lastReviewAskAt: new Date().toISOString() });
    track('review_requested');
    await StoreReview.requestReview();
  } catch {
    // Si la tienda no responde, no insistimos.
  }
}
