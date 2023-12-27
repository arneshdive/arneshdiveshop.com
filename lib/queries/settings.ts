import { db, shopSettings } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

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
      // Return defaults matching schema defaults
      return {
        storeName: "Arne's Dive Shop",
        email: 'support@arnesdive.com',
        phone: '+62 812-3456-7890',
        whatsapp: '6281234567890',
        businessHours: 'Senin – Jumat: 09:00 – 17:00 WIB',
        about: null,
        addressFormatted: null,
        addressLat: null,
        addressLng: null,
        instagram: null,
        tiktok: null,
      };
    }

    return result[0];
  },
  ['shop-settings'],
  { tags: [SHOP_SETTINGS_CACHE_TAG] }
);

/**
 * Get shop settings for public display (footer, contact, etc.)
 * Only returns fields needed for public display
 */
export async function getPublicShopSettings() {
  const settings = await getShopSettings();
  
  if (!settings) {
    return {
      storeName: "Arne's Dive Shop",
      email: 'support@arnesdive.com',
      phone: '+62 812-3456-7890',
      whatsapp: '6281234567890',
      businessHours: 'Senin – Jumat: 09:00 – 17:00 WIB',
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
    instagram: settings.instagram,
    tiktok: settings.tiktok,
  };
}
