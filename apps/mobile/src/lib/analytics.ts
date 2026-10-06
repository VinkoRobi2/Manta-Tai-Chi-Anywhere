/**
 * Métricas del onboarding. Por ahora solo se escriben en consola en desarrollo.
 * Nunca se mandan datos personales.
 */
export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'account_signed_in'
  | 'account_guest';

export type AnalyticsProps = Record<string, string | number | boolean | null>;

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (__DEV__) console.log(`[analytics] ${event}`, props);
}
