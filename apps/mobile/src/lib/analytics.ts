/**
 * Métricas de producto. Por ahora solo se escriben en consola en desarrollo.
 * Con estos eventos se decide todo: cuántos terminan la primera clase, cuántos vuelven, cuántos pagan.
 * Nunca se mandan datos personales.
 */
export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'space_selected'
  | 'lesson_sheet_opened'
  | 'lesson_started'
  | 'lesson_completed'
  | 'lesson_abandoned'
  | 'mood_logged'
  | 'reminder_enabled'
  | 'paywall_viewed'
  | 'trial_started'
  | 'purchase_restored'
  | 'voyage_prepared'
  | 'review_requested';

export type AnalyticsProps = Record<string, string | number | boolean | null>;

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (__DEV__) console.log(`[analytics] ${event}`, props);
}
