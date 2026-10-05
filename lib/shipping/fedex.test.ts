import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/queries/settings', () => ({
  getShopSettings: vi.fn(async () => ({ originPostalCode: '80227', originCountryCode: 'ID' })),
}));

describe('FedEx USD shipping quotes', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('FEDEX_API_KEY', 'test-key');
    vi.stubEnv('FEDEX_SECRET_KEY', 'test-secret');
    vi.stubEnv('FEDEX_ACCOUNT_NUMBER', 'test-account');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  async function quote(ratedShipmentDetails: unknown[]) {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: 'test-token', expires_in: 3600 }))
      .mockResolvedValueOnce(Response.json({ output: { rateReplyDetails: [{
        serviceType: 'INTERNATIONAL_PRIORITY', serviceName: 'International Priority', ratedShipmentDetails,
      }] } }));
    vi.stubGlobal('fetch', fetchMock);
    const { calculateInternationalShippingRates } = await import('./fedex');
    const result = await calculateInternationalShippingRates({
      address1: '10 Example Street', city: 'London', postalCode: 'SW1A 1AA', countryCode: 'GB',
    }, [{ quantity: 2, product: { weightGrams: 500 } }]);
    return { result, fetchMock };
  }

  it('requests preferred USD and uses the USD account quote rather than a native-currency amount', async () => {
    const { result, fetchMock } = await quote([
      { rateType: 'ACCOUNT', currency: 'IDR', totalNetCharge: 400000 },
      { rateType: 'LIST', currency: 'USD', totalNetCharge: 35 },
      { rateType: 'PREFERRED_ACCOUNT', currency: 'USD', totalNetCharge: 25.5 },
    ]);
    const request = JSON.parse(fetchMock.mock.calls[1]![1].body);
    expect(request.requestedShipment).toMatchObject({
      preferredCurrency: 'USD', rateRequestType: ['LIST', 'ACCOUNT', 'PREFERRED'],
    });
    expect(result.rates).toMatchObject([{ courier: 'fedex', costCents: 2550 }]);
    expect(result.error).toBeUndefined();
  });

  it.each([
    { details: [{ rateType: 'ACCOUNT', currency: 'IDR', totalNetCharge: 400000 }] },
    { details: [] },
    { details: [{ rateType: 'ACCOUNT', currency: 'USD', totalNetCharge: 0 }] },
  ])('rejects unusable rates instead of charging them as USD or free shipping', async ({ details }) => {
    const { result } = await quote(details);
    expect(result.rates).toEqual([]);
    expect(result.error).toBe('Tidak ada tarif FedEx dalam USD tersedia untuk alamat ini.');
  });
});
