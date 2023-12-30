export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

/**
 * CONVENTION: All prices in the system are stored as cents (1 Rupiah = 100 cents).
 * - Rp 25.000 shipping = 2500000 cents
 * - Rp 500.000 threshold = 50000000 cents
 */
export const shippingMethods: ShippingMethod[] = [
  {
    id: 'jne-regular',
    name: 'JNE Reguler',
    description: '3-5 hari kerja',
    price: 2500000, // Rp 25.000 in cents
    estimatedDays: '3-5',
  },
  {
    id: 'jne-yes',
    name: 'JNE YES',
    description: '1-2 hari kerja',
    price: 4500000, // Rp 45.000 in cents
    estimatedDays: '1-2',
  },
  {
    id: 'sicepat-reg',
    name: 'SiCepat REG',
    description: '2-3 hari kerja',
    price: 2000000, // Rp 20.000 in cents
    estimatedDays: '2-3',
  },
];

// Rp 500.000 in cents
export const FREE_SHIPPING_THRESHOLD = 50000000;
