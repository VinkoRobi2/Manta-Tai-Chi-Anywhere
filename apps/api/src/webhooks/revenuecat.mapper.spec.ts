import { mapRevenueCatEvent, type RevenueCatEvent } from './revenuecat.mapper.js';

const NOW = new Date('2026-10-05T12:00:00Z');
const FUTURE = NOW.getTime() + 30 * 24 * 60 * 60 * 1000;
const PAST = NOW.getTime() - 1000;

function event(overrides: Partial<RevenueCatEvent>): RevenueCatEvent {
  return {
    id: 'evt_1',
    type: 'INITIAL_PURCHASE',
    app_user_id: '$RCAnonymousID:abc',
    product_id: 'manta_anual',
    entitlement_ids: ['premium'],
    expiration_at_ms: FUTURE,
    store: 'PLAY_STORE',
    ...overrides,
  };
}

describe('mapRevenueCatEvent', () => {
  it('activa una compra de por vida (sin vencimiento)', () => {
    const change = mapRevenueCatEvent(
      event({ type: 'NON_RENEWING_PURCHASE', expiration_at_ms: null }),
      'premium',
      NOW,
    );
    expect(change).toMatchObject({ isActive: true, expiresAt: null });
  });

  it('activa una renovación vigente', () => {
    expect(mapRevenueCatEvent(event({ type: 'RENEWAL' }), 'premium', NOW)?.isActive).toBe(true);
  });

  it('desactiva al vencer', () => {
    expect(mapRevenueCatEvent(event({ type: 'EXPIRATION' }), 'premium', NOW)?.isActive).toBe(false);
  });

  it('mantiene el acceso tras cancelar hasta la fecha de vencimiento', () => {
    expect(mapRevenueCatEvent(event({ type: 'CANCELLATION' }), 'premium', NOW)?.isActive).toBe(
      true,
    );
    expect(
      mapRevenueCatEvent(event({ type: 'CANCELLATION', expiration_at_ms: PAST }), 'premium', NOW)
        ?.isActive,
    ).toBe(false);
  });

  it('ignora eventos de otro entitlement', () => {
    expect(mapRevenueCatEvent(event({ entitlement_ids: ['otro'] }), 'premium', NOW)).toBeNull();
  });

  it('ignora eventos de prueba', () => {
    expect(mapRevenueCatEvent(event({ type: 'TEST' }), 'premium', NOW)).toBeNull();
  });
});
