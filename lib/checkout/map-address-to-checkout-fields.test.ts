import { describe, it, expect } from 'vitest';
import { mapAddressToCheckoutFields } from './map-address-to-checkout-fields';

describe('mapAddressToCheckoutFields', () => {
  it('passes through first/last name and address/destination fields', () => {
    const result = mapAddressToCheckoutFields({
      firstName: 'Budi',
      lastName: 'Santoso',
      phone: '081234567890',
      address1: 'Jl. Merdeka No. 1',
      address2: 'Dekat masjid',
      rajaongkirCityId: '501',
      rajaongkirCityName: 'Sanur, Denpasar Selatan, Denpasar, Bali',
      rajaongkirProvince: 'Bali',
      rajaongkirCity: 'Denpasar',
      rajaongkirDistrict: 'Denpasar Selatan',
      rajaongkirSubdistrict: 'Sanur',
      rajaongkirPostalCode: '80227',
    });

    expect(result).toEqual({
      firstName: 'Budi',
      lastName: 'Santoso',
      phone: '081234567890',
      address1: 'Jl. Merdeka No. 1',
      address2: 'Dekat masjid',
      rajaongkirCityId: '501',
      rajaongkirCityName: 'Sanur, Denpasar Selatan, Denpasar, Bali',
      rajaongkirProvince: 'Bali',
      rajaongkirCity: 'Denpasar',
      rajaongkirDistrict: 'Denpasar Selatan',
      rajaongkirSubdistrict: 'Sanur',
      rajaongkirPostalCode: '80227',
    });
  });

  it('falls back to empty strings for null phone and address2, and keeps an empty last name as-is', () => {
    const result = mapAddressToCheckoutFields({
      firstName: 'Ani',
      lastName: '',
      phone: null,
      address1: 'Jl. Sudirman No. 2',
      address2: null,
      rajaongkirCityId: '502',
      rajaongkirCityName: null,
      rajaongkirProvince: null,
      rajaongkirCity: null,
      rajaongkirDistrict: null,
      rajaongkirSubdistrict: null,
      rajaongkirPostalCode: null,
    });

    expect(result.firstName).toBe('Ani');
    expect(result.lastName).toBe('');
    expect(result.phone).toBe('');
    expect(result.address2).toBe('');
  });
});
