import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/rajaongkir/client', () => ({
  rajaongkirClient: { searchDestination: vi.fn(async () => [{
    id: '501', subdistrict: 'Sanur', name: 'Sanur, Denpasar, Bali',
    province: 'Bali', city: 'Denpasar', district: 'Denpasar Selatan', postalCode: '80227',
  }]) },
}));

import { GET } from './route';

describe('shipping destination search', () => {
  it('passes the RajaOngkir postal code to the checkout destination selector', async () => {
    const response = await GET(new NextRequest('http://localhost/api/shipping/cities?search=Sanur'));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ cities: [{ id: '501', postalCode: '80227' }] });
  });
});
