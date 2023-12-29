import { z } from 'zod';
import { provinces } from '@/lib/constants/provinces';

// Indonesian postal code patterns by province prefix
// Format: 5 digits, first 2 digits indicate province/region
const POSTAL_CODE_PREFIXES: Record<string, string[]> = {
  'Aceh': ['23', '24'],
  'Sumatera Utara': ['20', '21', '22'],
  'Sumatera Barat': ['25', '26'],
  'Riau': ['28'],
  'Jambi': ['36'],
  'Sumatera Selatan': ['30', '31', '32'],
  'Bengkulu': ['38'],
  'Lampung': ['34', '35'],
  'Kepulauan Bangka Belitung': ['33'],
  'Kepulauan Riau': ['29'],
  'DKI Jakarta': ['10', '11', '12', '13', '14', '15', '16'],
  'Jawa Barat': ['16', '17', '18', '19', '40', '41', '42', '43', '44', '45', '46'],
  'Jawa Tengah': ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59'],
  'DI Yogyakarta': ['55'],
  'Jawa Timur': ['60', '61', '62', '63', '64', '65', '66', '67', '68', '69'],
  'Banten': ['15', '42'],
  'Bali': ['80', '81', '82'],
  'Nusa Tenggara Barat': ['83', '84'],
  'Nusa Tenggara Timur': ['85', '86'],
  'Kalimantan Barat': ['78', '79'],
  'Kalimantan Tengah': ['73', '74'],
  'Kalimantan Selatan': ['70', '71', '72'],
  'Kalimantan Timur': ['75', '76'],
  'Kalimantan Utara': ['77'],
  'Sulawesi Utara': ['95'],
  'Sulawesi Tengah': ['94'],
  'Sulawesi Selatan': ['90', '91', '92'],
  'Sulawesi Tenggara': ['93'],
  'Gorontalo': ['96'],
  'Sulawesi Barat': ['91'],
  'Maluku': ['97'],
  'Maluku Utara': ['97'],
  'Papua': ['98', '99'],
  'Papua Barat': ['98'],
};

/**
 * Validate Indonesian postal code format (5 digits)
 */
export function isValidPostalCodeFormat(code: string): boolean {
  return /^\d{5}$/.test(code);
}

/**
 * Check if postal code matches province
 * Returns true if postal code prefix matches the province
 */
export function postalCodeMatchesProvince(postalCode: string, province: string): boolean {
  const prefixes = POSTAL_CODE_PREFIXES[province];
  if (!prefixes) return true; // If province not in mapping, allow any postal code
  
  const prefix = postalCode.substring(0, 2);
  return prefixes.includes(prefix);
}

/**
 * Validate Indonesian phone number
 * Accepts: 08xxxxxxxxxx, +62 8xxxxxxxxx, 62 8xxxxxxxxx
 */
export function isValidIndonesianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+62|62|0)8[1-9][0-9]{7,10}$/.test(cleaned);
}

/**
 * Format phone number to standard Indonesian format (08xxxxxxxxxx)
 */
export function formatIndonesianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+62')) {
    return '0' + cleaned.substring(3);
  }
  if (cleaned.startsWith('62')) {
    return '0' + cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Check if province is valid Indonesian province
 */
export function isValidProvince(province: string): boolean {
  return provinces.includes(province as any);
}

/**
 * Get list of valid provinces
 */
export function getValidProvinces(): readonly string[] {
  return provinces;
}

// Zod schemas for validation

export const indonesianPostalCodeSchema = z
  .string()
  .length(5, 'Kode pos harus 5 digit')
  .regex(/^\d{5}$/, 'Kode pos harus berupa angka');

export const indonesianPhoneSchema = z
  .string()
  .regex(/^(\+62|62|0)8[1-9][0-9]{7,10}$/, 'Format nomor telepon tidak valid');

export const indonesianProvinceSchema = z
  .string()
  .refine((val) => provinces.includes(val as any), {
    message: 'Provinsi tidak valid',
  });

export const indonesiaAddressSchema = z.object({
  address1: z.string().min(1, 'Alamat wajib diisi').max(255, 'Alamat terlalu panjang'),
  address2: z.string().max(255, 'Alamat tambahan terlalu panjang').optional(),
  city: z.string().min(1, 'Kota wajib diisi').max(100, 'Nama kota terlalu panjang'),
  province: indonesianProvinceSchema,
  postalCode: indonesianPostalCodeSchema,
  country: z.string().default('Indonesia'),
});

export const checkoutContactSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  phone: indonesianPhoneSchema,
  fullName: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama terlalu panjang'),
});

export const checkoutShippingSchema = z.object({
  shippingMethod: z.enum(['jne-regular', 'jne-yes', 'sicepat-reg']).default('jne-regular'),
});

export const checkoutSessionSchema = checkoutContactSchema
  .merge(indonesiaAddressSchema)
  .merge(checkoutShippingSchema)
  .extend({
    lat: z.string().optional(),
    lng: z.string().optional(),
    formattedAddress: z.string().optional(),
    notes: z.string().max(500, 'Catatan terlalu panjang').optional(),
  });

export type IndonesiaAddress = z.infer<typeof indonesiaAddressSchema>;
export type CheckoutContact = z.infer<typeof checkoutContactSchema>;
export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;
