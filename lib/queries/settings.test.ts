import { beforeEach, expect, it, vi } from 'vitest';
import { siteConfig } from '@/config/site';
import { getBusinessJsonLd } from '@/lib/seo/business';

const { query } = vi.hoisted(() => ({
  query: {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: { select: () => query },
  shopSettings: { id: 'shop_settings.id' },
}));
vi.mock('next/cache', () => ({ unstable_cache: <T>(callback: T) => callback }));

import { getShopSettings, getPublicShopSettings } from './settings';

beforeEach(() => vi.clearAllMocks());

it('keeps shipping/admin settings intact while projecting the confirmed public storefront for UI and schema', async () => {
  const shippingSettings = {
    storeName: 'Arnesh Dive',
    email: 'public@example.com',
    phone: '0817-4722-020',
    whatsapp: '628174722020',
    businessHours: 'Senin – Jumat: 10:00 – 19:00\nSabtu: 10:00 – 17:00',
    addressFormatted: 'Jalan Pasar Selatan, Bandung City, West Java, 40181, Indonesia',
    addressCity: 'Bandung City',
    addressProvince: 'West Java',
    addressLat: '-6.91',
    addressLng: '107.60',
    originPostalCode: '40181',
    originCountryCode: 'ID',
    instagram: '',
    tiktok: '',
  };
  const original = { ...shippingSettings };
  query.limit.mockResolvedValue([shippingSettings]);

  expect(await getShopSettings()).toBe(shippingSettings);
  const publicSettings = await getPublicShopSettings();
  expect(shippingSettings).toEqual(original);
  expect(publicSettings.addressFormatted).toBe(
    'Ruko Griya Pesona Rinjani, Jl. Adi Sucipto Blok B15, Ampenan Utara, Kec. Ampenan, Kota Mataram, Nusa Tenggara Barat 83118, Indonesia',
  );
  expect(publicSettings.phone).toBe(shippingSettings.phone);
  expect(publicSettings.businessHours).toBe(shippingSettings.businessHours);
  expect(publicSettings).not.toHaveProperty('addressLat');
  expect(publicSettings).not.toHaveProperty('addressLng');
  expect(publicSettings).not.toHaveProperty('originPostalCode');

  const data = getBusinessJsonLd(publicSettings);
  expect(data.address).toEqual({
    '@type': 'PostalAddress',
    streetAddress: siteConfig.publicStoreAddress.streetAddress,
    addressLocality: 'Kota Mataram',
    addressRegion: 'Nusa Tenggara Barat',
    postalCode: '83118',
    addressCountry: 'ID',
  });
  expect(data).not.toHaveProperty('geo');
  expect(JSON.stringify(data)).not.toContain('Bandung');
  expect(JSON.stringify(data)).not.toContain('40181');
});

it('still exposes the confirmed public address when no DB settings exist', async () => {
  query.limit.mockResolvedValue([]);
  const publicSettings = await getPublicShopSettings();
  expect(publicSettings.addressFormatted).toBe(siteConfig.publicStoreAddress.formatted);
  expect(getBusinessJsonLd(publicSettings).address?.postalCode).toBe('83118');
  expect(await getShopSettings()).toMatchObject({ addressFormatted: null, addressLat: null, addressLng: null });
});
