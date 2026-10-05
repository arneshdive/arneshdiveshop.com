import { describe, expect, it } from 'vitest';
import { getBusinessJsonLd } from './business';
import { siteConfig } from '@/config/site';

const settings = {
  storeName: 'Arnesh Dive',
  phone: '0817-4722-020',
  businessHours: 'Senin – Jumat: 10:00 – 19:00\nSabtu: 10:00 – 17:00',
  addressStreet: 'A confirmed store street address',
  addressCity: 'Confirmed city',
  addressProvince: 'Confirmed province',
  addressPostalCode: '83118',
  addressCountry: 'ID',
};

describe('business structured data', () => {
  it('uses settings for the store and connects its brand and official storefront profiles', () => {
    const data = getBusinessJsonLd(settings);
    expect(data['@type']).toBe('SportingGoodsStore');
    expect(data['@id']).toBe(`${siteConfig.url}/#store`);
    expect(data.telephone).toBe('+628174722020');
    expect(data.address).toMatchObject({
      streetAddress: settings.addressStreet,
      addressLocality: settings.addressCity,
      addressRegion: settings.addressProvince,
      addressCountry: 'ID',
      postalCode: settings.addressPostalCode,
    });
    expect(data.brand.name).toBe(data.name);
    expect(data.alternateName).toBe(siteConfig.sellerName);
    expect(new Set(data.sameAs).size).toBe(data.sameAs.length);
    expect(data.sameAs).toEqual(expect.arrayContaining([
      siteConfig.links.instagram, siteConfig.links.haesteInstagram,
      siteConfig.links.shopee, siteConfig.links.tokopedia,
    ]));
    expect(data).not.toHaveProperty('legalName');
    expect(data).not.toHaveProperty('aggregateRating');
    expect(data).not.toHaveProperty('geo');
  });

  it('expands the confirmed weekday range and Saturday schedule without inventing Sunday hours', () => {
    const hours = getBusinessJsonLd(settings).openingHoursSpecification!;
    expect(hours).toHaveLength(2);
    expect(hours[0]).toMatchObject({ opens: '10:00', closes: '19:00' });
    expect(hours[0]!.dayOfWeek).toEqual([
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
    ].map((day) => `https://schema.org/${day}`));
    expect(hours[1]).toMatchObject({
      dayOfWeek: ['https://schema.org/Saturday'], opens: '10:00', closes: '17:00',
    });
  });

  it.each(['', 'By appointment', 'Senin: 25:00 – 26:00', 'Jumat – Senin: 10:00 – 19:00'])(
    'omits an unconfirmed or invalid schedule: %s', (businessHours) => {
      expect(getBusinessJsonLd({ ...settings, businessHours })).not.toHaveProperty('openingHoursSpecification');
    },
  );

  it('does not fabricate an address or telephone when settings are empty', () => {
    const data = getBusinessJsonLd({
      ...settings, addressStreet: null, addressCity: null, addressProvince: null,
      addressPostalCode: null, addressCountry: null, phone: '',
    });
    expect(data).not.toHaveProperty('address');
    expect(data).not.toHaveProperty('telephone');
  });

  it('preserves international telephone numbers and follows later public-settings updates', () => {
    const data = getBusinessJsonLd({ ...settings, phone: '+62 817 4722 020', addressCity: 'Updated city' });
    expect(data.telephone).toBe('+628174722020');
    expect(data.address?.addressLocality).toBe('Updated city');
  });
});
