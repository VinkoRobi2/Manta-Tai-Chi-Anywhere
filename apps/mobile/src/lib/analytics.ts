import { useGlobalSearchParams, usePathname } from 'expo-router';
import PostHog from 'posthog-react-native';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Métricas de uso, en PostHog. Nunca se mandan datos personales: no se identifica a nadie
 * y cada teléfono cuenta como un visitante anónimo.
 */
export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'account_signed_in'
  | 'account_guest';

export type AnalyticsProps = Record<string, string | number | boolean | null>;

/** Sin señal no es un error: los eventos esperan en el teléfono y salen cuando vuelve. */
class OfflineFriendlyPostHog extends PostHog {
  override flush(): Promise<void> {
    return super.flush().catch((error: unknown) => {
      if (!(error instanceof Error && error.name === 'PostHogFetchNetworkError')) throw error;
    });
  }
}

/**
 * La llave del proyecto es pública (viaja dentro de la app). Sin ella no se manda nada,
 * y tampoco desde la vista web, que es solo de desarrollo.
 */
const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const posthog =
  key && Platform.OS !== 'web'
    ? new OfflineFriendlyPostHog(key, { host: 'https://us.i.posthog.com' })
    : null;

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (__DEV__) console.log(`[analytics] ${event}`, props);
  posthog?.capture(event, props);
}

/** Registra cada pantalla que se abre, con su ruta (/bienvenida/tiempo). Va en el layout raíz. */
export function useScreenTracking(): void {
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  useEffect(() => {
    // «/» solo redirige al onboarding o a Inicio (app/index.tsx): no es una pantalla.
    if (pathname === '/') return;
    if (__DEV__) console.log(`[analytics] $screen ${pathname}`, params);
    void posthog?.screen(pathname, params).catch(() => undefined);
  }, [pathname, params]);
}
