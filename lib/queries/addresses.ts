import { db } from '@/lib/db';
import { addresses } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { isDuplicateAddress } from '@/lib/addresses/is-duplicate-address';

// ============================================================================
// Types
// ============================================================================

export interface AddressWithDetails {
  id: string;
  name: string;
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
  isDefault: boolean;
  createdAt: Date;
}

export interface CreateAddressInput {
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2?: string;
  rajaongkirCityId: string;
  rajaongkirCityName: string;
  rajaongkirProvince?: string;
  rajaongkirCity?: string;
  rajaongkirDistrict?: string;
  rajaongkirSubdistrict?: string;
  rajaongkirPostalCode?: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput extends Partial<CreateAddressInput> {}

// ============================================================================
// Address Queries
// ============================================================================

/**
 * Get all addresses for a customer
 */
export async function getCustomerAddresses(customerId: string): Promise<AddressWithDetails[]> {
  const results = await db.query.addresses.findMany({
    where: eq(addresses.customerId, customerId),
    orderBy: [desc(addresses.isDefault), desc(addresses.createdAt)],
  });

  return results as AddressWithDetails[];
}

/**
 * Get a single address by ID
 */
export async function getAddressById(addressId: string, customerId: string): Promise<AddressWithDetails | null> {
  const address = await db.query.addresses.findFirst({
    where: eq(addresses.id, addressId),
  });

  // Ensure the address belongs to the customer
  if (!address || address.customerId !== customerId) {
    return null;
  }

  return address as AddressWithDetails;
}

/**
 * Create a new address
 */
export async function createAddress(
  customerId: string,
  input: CreateAddressInput
): Promise<AddressWithDetails> {
  // If this is the first address, make it default
  const existingAddresses = await db.query.addresses.findMany({
    where: eq(addresses.customerId, customerId),
  });

  const shouldBeDefault = input.isDefault ?? existingAddresses.length === 0;

  // If setting as default, unset other defaults first
  if (shouldBeDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.customerId, customerId));
  }

  const [address] = await db
    .insert(addresses)
    .values({
      customerId,
      name: input.name,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      address1: input.address1,
      address2: input.address2 || null,
      rajaongkirCityId: input.rajaongkirCityId,
      rajaongkirCityName: input.rajaongkirCityName,
      rajaongkirProvince: input.rajaongkirProvince || null,
      rajaongkirCity: input.rajaongkirCity || null,
      rajaongkirDistrict: input.rajaongkirDistrict || null,
      rajaongkirSubdistrict: input.rajaongkirSubdistrict || null,
      rajaongkirPostalCode: input.rajaongkirPostalCode || null,
      isDefault: shouldBeDefault,
    })
    .returning();

  return address as AddressWithDetails;
}

/**
 * Save an order's shipping address to the customer's address book, unless
 * they already have a matching one saved (same street address, destination,
 * and recipient phone). This is how guest checkouts - who never touch
 * `SavedAddressSelector` - end up with a saved address for their next visit.
 */
export async function saveAddressFromOrder(
  customerId: string,
  input: CreateAddressInput
): Promise<void> {
  const existingAddresses = await getCustomerAddresses(customerId);

  if (isDuplicateAddress(existingAddresses, input)) {
    return;
  }

  await createAddress(customerId, input);
}

/**
 * Update an address
 */
export async function updateAddress(
  addressId: string,
  customerId: string,
  input: UpdateAddressInput
): Promise<AddressWithDetails | null> {
  // Verify ownership
  const existing = await db.query.addresses.findFirst({
    where: eq(addresses.id, addressId),
  });

  if (!existing || existing.customerId !== customerId) {
    return null;
  }

  // If setting as default, unset other defaults first
  if (input.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.customerId, customerId));
  }

  const [updated] = await db
    .update(addresses)
    .set({
      name: input.name,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      address1: input.address1,
      address2: input.address2,
      rajaongkirCityId: input.rajaongkirCityId,
      rajaongkirCityName: input.rajaongkirCityName,
      rajaongkirProvince: input.rajaongkirProvince,
      rajaongkirCity: input.rajaongkirCity,
      rajaongkirDistrict: input.rajaongkirDistrict,
      rajaongkirSubdistrict: input.rajaongkirSubdistrict,
      rajaongkirPostalCode: input.rajaongkirPostalCode,
      isDefault: input.isDefault,
    })
    .where(eq(addresses.id, addressId))
    .returning();

  return updated as AddressWithDetails;
}

/**
 * Delete an address
 */
export async function deleteAddress(
  addressId: string,
  customerId: string
): Promise<boolean> {
  // Verify ownership
  const existing = await db.query.addresses.findFirst({
    where: eq(addresses.id, addressId),
  });

  if (!existing || existing.customerId !== customerId) {
    return false;
  }

  await db.delete(addresses).where(eq(addresses.id, addressId));

  // If deleted address was default, set the most recent as default
  if (existing.isDefault) {
    const remaining = await db.query.addresses.findFirst({
      where: eq(addresses.customerId, customerId),
      orderBy: [desc(addresses.createdAt)],
    });

    if (remaining) {
      await db
        .update(addresses)
        .set({ isDefault: true })
        .where(eq(addresses.id, remaining.id));
    }
  }

  return true;
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(
  addressId: string,
  customerId: string
): Promise<boolean> {
  // Verify ownership
  const existing = await db.query.addresses.findFirst({
    where: eq(addresses.id, addressId),
  });

  if (!existing || existing.customerId !== customerId) {
    return false;
  }

  // Unset all other defaults
  await db
    .update(addresses)
    .set({ isDefault: false })
    .where(eq(addresses.customerId, customerId));

  // Set this one as default
  await db
    .update(addresses)
    .set({ isDefault: true })
    .where(eq(addresses.id, addressId));

  return true;
}
