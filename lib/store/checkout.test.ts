import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkoutFormSchema } from '@/lib/validations/checkout';

async function hydrate(data: Record<string, unknown>, touched = {}) {
  vi.resetModules();
  let saved = JSON.stringify({ state: { data, touched }, version: 0 });
  const localStorage = {
    getItem: () => saved,
    setItem: (_key: string, value: string) => { saved = value; },
    removeItem: () => { saved = ''; },
  };
  vi.stubGlobal('window', { localStorage });
  const { useCheckoutStore } = await import('./checkout');
  return useCheckoutStore;
}

afterEach(() => vi.unstubAllGlobals());

describe('persisted checkout hydration', () => {
  it('merges old checkout data with defaults, derives names, and remains valid domestically', async () => {
    const store = await hydrate({
      fullName: 'Budi Putra Santoso', email: 'buyer@example.com', phone: '081234567890',
      address1: 'Jl. Merdeka No. 1', rajaongkirCityId: '501',
      rajaongkirPostalCode: '80227', shippingMethod: 'jne-reg', checkoutSessionId: 'existing-session',
    }, { email: true });
    const state = store.getState();
    expect(state.data).toMatchObject({
      firstName: 'Budi', lastName: 'Putra Santoso', countryCode: 'ID', country: 'Indonesia',
      intlCity: '', intlState: '', intlPostalCode: '',
      address1: 'Jl. Merdeka No. 1', rajaongkirPostalCode: '80227',
      shippingMethod: 'jne-reg', checkoutSessionId: 'existing-session',
    });
    expect(checkoutFormSchema.safeParse(state.data).success).toBe(true);
    expect(state.touched).toMatchObject({ email: true, firstName: false, intlCity: false });
    state.setField('address2', 'Near the beach');
    expect(store.getState().data.address2).toBe('Near the beach');
  });

  it('preserves current international fields and explicit names over a legacy fullName', async () => {
    const store = await hydrate({
      fullName: 'Old Name', firstName: 'Jane', lastName: 'Doe',
      countryCode: 'GB', country: 'United Kingdom', intlCity: 'London', intlPostalCode: 'SW1A 1AA',
    });
    expect(store.getState().data).toMatchObject({
      firstName: 'Jane', lastName: 'Doe', countryCode: 'GB', country: 'United Kingdom',
      intlCity: 'London', intlPostalCode: 'SW1A 1AA', intlState: '',
    });
  });
});
