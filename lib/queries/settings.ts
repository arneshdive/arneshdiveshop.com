import { db, shopSettings } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { siteConfig } from '@/config/site';

// ============================================================================
// Courier Settings
// ============================================================================

// All supported couriers
export const COURIERS = [
  { code: 'jne', name: 'JNE' },
  { code: 'jnt', name: 'J&T Express' },
  { code: 'sicepat', name: 'SiCepat' },
  { code: 'idexpress', name: 'ID Express' },
  { code: 'anteraja', name: 'AnterAja' },
  { code: 'pos', name: 'POS Indonesia' },
  { code: 'tiki', name: 'TIKI' },
] as const;

export type CourierCode = (typeof COURIERS)[number]['code'];

const DEFAULT_COURIERS: CourierCode[] = ['jne', 'jnt', 'sicepat'];

/**
 * Get active couriers from shop settings
 * Falls back to default if not configured
 */
export async function getActiveCouriers(): Promise<CourierCode[]> {
  const result = await db
    .select({ activeCouriers: shopSettings.activeCouriers })
    .from(shopSettings)
    .where(eq(shopSettings.id, 'default'))
    .limit(1);

  const settings = result[0];

  if (!settings?.activeCouriers) {
    return DEFAULT_COURIERS;
  }

  const couriers = settings.activeCouriers
    .split(',')
    .map((c) => c.trim())
    .filter((c): c is CourierCode => COURIERS.some((courier) => courier.code === c));

  return couriers.length > 0 ? couriers : DEFAULT_COURIERS;
}

/**
 * Validate courier codes
 */
export function validateCourierCodes(codes: string[]): {
  valid: boolean;
  error?: string;
  validCodes: CourierCode[];
} {
  if (!Array.isArray(codes) || codes.length === 0) {
    return { valid: false, error: 'Minimal 1 kurir harus aktif', validCodes: [] };
  }

  const validCodes = codes.filter((c): c is CourierCode =>
    COURIERS.some((courier) => courier.code === c)
  );

  if (validCodes.length === 0) {
    return { valid: false, error: 'Minimal 1 kurir harus aktif', validCodes: [] };
  }

  return { valid: true, validCodes };
}

// ============================================================================
// Shop Settings Queries
// ============================================================================

// Cache tag for shop settings
export const SHOP_SETTINGS_CACHE_TAG = 'shop-settings';

/**
 * Get shop settings (cached with on-demand revalidation)
 * Returns default values if no settings exist
 */
export const getShopSettings = unstable_cache(
  async () => {
    const result = await db
      .select()
      .from(shopSettings)
      .where(eq(shopSettings.id, 'default'))
      .limit(1);

    if (result.length === 0) {
      // Keep verified public contact details; do not guess a location or schedule.
      return {
        storeName: "Arnesh Dive",
        email: 'support@arneshdive.com',
        phone: '0817-4722-020',
        whatsapp: '628174722020',
        businessHours: '',
        about: null,
        addressFormatted: null,
        addressLat: null,
        addressLng: null,
        addressCity: null,
        addressProvince: null,
        rajaongkirCityId: null,
        rajaongkirCityName: null,
        originPostalCode: null,
        originCountryCode: 'ID',
        activeCouriers: 'jne,jnt,sicepat',
        instagram: null,
        tiktok: null,
      };
    }

    return result[0];
  },
  ['shop-settings'],
  { tags: [SHOP_SETTINGS_CACHE_TAG] }
);

// Public storefront location must never inherit shipping-origin/admin coordinates.
const publicAddressFields = {
  addressFormatted: siteConfig.publicStoreAddress.formatted,
  addressStreet: siteConfig.publicStoreAddress.streetAddress,
  addressCity: siteConfig.publicStoreAddress.addressLocality,
  addressProvince: siteConfig.publicStoreAddress.addressRegion,
  addressPostalCode: siteConfig.publicStoreAddress.postalCode,
  addressCountry: siteConfig.publicStoreAddress.addressCountry,
};

/** Get public contact details and the owner-confirmed physical storefront. */
export async function getPublicShopSettings() {
  const settings = await getShopSettings();
  
  if (!settings) {
    return {
      storeName: "Arnesh Dive",
      email: 'support@arneshdive.com',
      phone: '0817-4722-020',
      whatsapp: '628174722020',
      businessHours: '',
      ...publicAddressFields,
      instagram: null,
      tiktok: null,
    };
  }
  
  return {
    storeName: settings.storeName,
    email: settings.email,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    businessHours: settings.businessHours,
    ...publicAddressFields,
    instagram: settings.instagram,
    tiktok: settings.tiktok,
  };
}
