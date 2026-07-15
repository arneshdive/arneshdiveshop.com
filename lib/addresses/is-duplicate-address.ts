export interface AddressForDuplicateCheck {
  address1: string;
  rajaongkirCityId: string;
  phone: string | null;
}

/**
 * Compares a candidate address against a customer's existing saved addresses
 * to decide whether it's already in their address book (same street address,
 * same rajaongkir destination, same recipient phone). Used to avoid saving a
 * duplicate row every time an order is placed with an address the customer
 * already has on file.
 */
export function isDuplicateAddress(
  existing: AddressForDuplicateCheck[],
  candidate: AddressForDuplicateCheck
): boolean {
  const normalize = (value: string | null) => (value ?? '').trim().toLowerCase();

  return existing.some(
    (address) =>
      normalize(address.address1) === normalize(candidate.address1) &&
      address.rajaongkirCityId === candidate.rajaongkirCityId &&
      normalize(address.phone) === normalize(candidate.phone)
  );
}
