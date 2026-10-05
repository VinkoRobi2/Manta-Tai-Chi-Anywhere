import { getSettings, updateSettings, useSettings } from '@/features/settings/settings';

/**
 * Compras. Fase 1: implementación simulada. La real usará react-native-purchases
 * (RevenueCat) con el entitlement "premium" y la misma interfaz.
 * El acceso premium se guarda en el teléfono para que funcione sin señal.
 */

export type PlanId = 'annual' | 'lifetime' | 'monthly';

export interface Offering {
  id: PlanId;
  /** Precio en centavos de dólar (en la versión real lo da la tienda, ya en la moneda local). */
  priceCents: number;
  currency: string;
  trialDays: number;
}

export interface PurchasesService {
  getOfferings(): Promise<Offering[]>;
  purchase(plan: PlanId): Promise<{ premium: boolean }>;
  restore(): Promise<{ premium: boolean }>;
  isPremium(): boolean;
}

const OFFERINGS: Offering[] = [
  { id: 'annual', priceCents: 3999, currency: 'USD', trialDays: 7 },
  { id: 'lifetime', priceCents: 8999, currency: 'USD', trialDays: 0 },
  { id: 'monthly', priceCents: 699, currency: 'USD', trialDays: 0 },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class FakePurchases implements PurchasesService {
  async getOfferings() {
    return OFFERINGS;
  }

  async purchase(_plan: PlanId) {
    await wait(900);
    updateSettings({ premium: true });
    return { premium: true };
  }

  async restore() {
    await wait(700);
    return { premium: getSettings().premium };
  }

  isPremium() {
    return getSettings().premium;
  }
}

export const purchases: PurchasesService = new FakePurchases();

export function usePremium(): boolean {
  return useSettings().premium;
}

export function formatPrice(cents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}
