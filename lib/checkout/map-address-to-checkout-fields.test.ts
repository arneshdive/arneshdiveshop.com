import { describe, it, expect } from 'vitest';
import { mapAddressToCheckoutFields } from './map-address-to-checkout-fields';

describe('mapAddressToCheckoutFields', () => {
  it('combines first and last name into fullName and passes through address/destination fields', () => {
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
      fullName: 'Budi Santoso',
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

  it('falls back to empty strings for null phone and address2, and trims a missing last name', () => {
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

    expect(result.fullName).toBe('Ani');
    expect(result.phone).toBe('');
    expect(result.address2).toBe('');
  });
});
