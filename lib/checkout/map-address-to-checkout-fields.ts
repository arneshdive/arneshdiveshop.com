export interface AddressForMapping {
  firstName: string;
  lastName: string;
  phone: string | null;
  address1: string;
  address2: string | null;
  rajaongkirCityId: string;
  rajaongkirCityName: string | null;
  rajaongkirProvince: string | null;
  rajaongkirCity: string | null;
  rajaongkirDistrict: string | null;
  rajaongkirSubdistrict: string | null;
  rajaongkirPostalCode: string | null;
}

export interface CheckoutFieldsFromAddress {
  fullName: string;
  phone: string;
  address1: string;
  address2: string;
  rajaongkirCityId: string;
  rajaongkirCityName: string | null;
  rajaongkirProvince: string | null;
  rajaongkirCity: string | null;
  rajaongkirDistrict: string | null;
  rajaongkirSubdistrict: string | null;
  rajaongkirPostalCode: string | null;
}

/**
 * Maps a saved address (or a freshly created one) onto the CheckoutData
 * fields that ShippingAddressForm already populates, so the rest of the
 * checkout flow (rate calculation, session creation, order creation)
 * doesn't need to know whether the data came from typing or from picking
 * a saved address.
 */
export function mapAddressToCheckoutFields(address: AddressForMapping): CheckoutFieldsFromAddress {
  return {
    fullName: `${address.firstName} ${address.lastName}`.trim(),
    phone: address.phone ?? '',
    address1: address.address1,
    address2: address.address2 ?? '',
    rajaongkirCityId: address.rajaongkirCityId,
    rajaongkirCityName: address.rajaongkirCityName,
    rajaongkirProvince: address.rajaongkirProvince,
    rajaongkirCity: address.rajaongkirCity,
    rajaongkirDistrict: address.rajaongkirDistrict,
    rajaongkirSubdistrict: address.rajaongkirSubdistrict,
    rajaongkirPostalCode: address.rajaongkirPostalCode,
  };
}
