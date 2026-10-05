import { z } from 'zod';
import type { EntitlementChange } from '../entitlements/entitlements.service.js';

/** Solo validamos los campos que usamos; RevenueCat puede agregar más sin romper nada. */
export const RevenueCatWebhookSchema = z
  .object({
    api_version: z.string().optional(),
    event: z
      .object({
        id: z.string().min(1),
        type: z.string().min(1),
        app_user_id: z.string().optional(),
        product_id: z.string().nullish(),
        entitlement_ids: z.array(z.string()).nullish(),
        expiration_at_ms: z.number().nullish(),
        store: z.string().nullish(),
      })
      .loose(),
  })
  .loose();

export type RevenueCatWebhook = z.infer<typeof RevenueCatWebhookSchema>;
export type RevenueCatEvent = RevenueCatWebhook['event'];

/** Eventos que dan acceso mientras no haya vencido. */
const GRANTING = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'SUBSCRIPTION_EXTENDED',
  'TEMPORARY_ENTITLEMENT_GRANT',
]);

/** Eventos donde la persona conserva el acceso hasta la fecha de vencimiento. */
const KEEP_UNTIL_EXPIRY = new Set(['CANCELLATION', 'BILLING_ISSUE']);

/**
 * Traduce un evento de RevenueCat a un cambio de acceso.
 * Devuelve null si el evento no afecta a nuestro entitlement.
 * Función pura: fácil de probar (ver revenuecat.mapper.spec.ts).
 */
export function mapRevenueCatEvent(
  event: RevenueCatEvent,
  entitlementId: string,
  now: Date = new Date(),
): EntitlementChange | null {
  if (!event.app_user_id) return null;
  if (!event.entitlement_ids?.includes(entitlementId)) return null;

  const expiresAt = event.expiration_at_ms != null ? new Date(event.expiration_at_ms) : null;
  let isActive: boolean;

  if (event.type === 'EXPIRATION') {
    isActive = false;
  } else if (GRANTING.has(event.type)) {
    isActive = expiresAt === null || expiresAt > now;
  } else if (KEEP_UNTIL_EXPIRY.has(event.type)) {
    isActive = expiresAt !== null && expiresAt > now;
  } else {
    return null;
  }

  return {
    appUserId: event.app_user_id,
    isActive,
    expiresAt,
    productId: event.product_id ?? null,
    store: event.store ?? null,
  };
}
