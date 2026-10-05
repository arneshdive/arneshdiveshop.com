import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { checkoutFormSchema } from '@/lib/validations/checkout';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getCart: vi.fn(),
  createCheckoutSession: vi.fn(),
  getCheckoutSessionById: vi.fn(),
  getCheckoutSessionByGuestId: vi.fn(),
  getCheckoutSessionByUserId: vi.fn(),
  updateCheckoutSession: vi.fn(),
  deleteCheckoutSession: vi.fn(),
  updateCheckoutSessionTotals: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: () => ({ value: 'guest-1' }) })),
}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/queries/cart', () => ({
  getCartByUserId: mocks.getCart,
  getCartByGuestId: mocks.getCart,
}));
vi.mock('@/lib/queries/checkout', () => mocks);

import { POST } from './route';

const domestic = {
  email: 'buyer@example.com',
  phone: '0812-3456-7890',
  fullName: 'Budi Santoso',
  address1: 'Jl. Merdeka No. 1',
  countryCode: 'ID',
  rajaongkirCityId: '501',
  rajaongkirCity: 'Denpasar',
  rajaongkirProvince: 'Bali',
  rajaongkirDistrict: 'Denpasar Selatan',
  rajaongkirPostalCode: null,
  city: 'Denpasar',
  province: 'Bali',
  postalCode: null,
};
const international = {
  ...domestic,
  countryCode: 'GB',
  phone: '+44 (20) 7946 0958',
  rajaongkirCityId: null,
  rajaongkirCity: null,
  rajaongkirProvince: null,
  rajaongkirDistrict: null,
  city: 'London',
  province: '',
  postalCode: 'SW1A 1AA',
};

function post(body: unknown) {
  return POST(new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

describe('checkout address and phone contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(null);
    mocks.getCart.mockResolvedValue({ id: 'cart-1', items: [{ quantity: 1 }], subtotalCents: 10000 });
    mocks.getCheckoutSessionByGuestId.mockResolvedValue(null);
    mocks.createCheckoutSession.mockResolvedValue({ id: 'checkout-1' });
    mocks.getCheckoutSessionById.mockResolvedValue({ id: 'checkout-1' });
  });

  it('accepts the domestic UI payload with a null generic postal code', async () => {
    expect((await post(domestic)).status).toBe(200);
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      phone: '6281234567890',
      rajaongkirCityId: '501',
      postalCode: undefined,
    }));
  });

  it('falls back to the RajaOngkir postal code when the generic field is null', async () => {
    expect((await post({ ...domestic, rajaongkirPostalCode: '80227' })).status).toBe(200);
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      postalCode: '80227', rajaongkirPostalCode: '80227',
    }));
  });

  it('accepts a null RajaOngkir destination internationally and preserves the calling code', async () => {
    expect((await post(international)).status).toBe(200);
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      phone: '+442079460958', countryCode: 'GB', country: 'United Kingdom',
      rajaongkirCityId: undefined, city: 'London', postalCode: 'SW1A 1AA',
    }));
  });

  it.each([
    { ...domestic, rajaongkirCityId: null },
    { ...international, city: null },
    { ...international, postalCode: null },
  ])('still rejects a missing country-specific destination', async (body) => {
    expect((await post(body)).status).toBe(400);
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it.each([
    ['ID', '0812-3456-7890', true],
    ['ID', '+44 20 7946 0958', false],
    ['GB', '+44 (20) 7946 0958', true],
    ['SG', '6123 4567', true],
    ['GB', 'not-a-phone', false],
    ['GB', '+1234567890123456', false],
  ])('client/server agree for country %s, phone %s', async (countryCode, phone, valid) => {
    const body = { ...(countryCode === 'ID' ? domestic : international), countryCode, phone };
    const client = checkoutFormSchema.safeParse({
      ...body, firstName: 'Budi', lastName: 'Santoso',
      intlCity: countryCode === 'ID' ? '' : 'London',
      intlPostalCode: countryCode === 'ID' ? '' : 'SW1A 1AA',
    });
    expect(client.success).toBe(valid);
    expect((await post(body)).status).toBe(valid ? 200 : 400);
    if (!valid) expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });
});
