export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

export const shippingMethods: ShippingMethod[] = [
  {
    id: 'jne-regular',
    name: 'JNE Reguler',
    description: '3-5 hari kerja',
    price: 25000,
    estimatedDays: '3-5',
  },
  {
    id: 'jne-yes',
    name: 'JNE YES',
    description: '1-2 hari kerja',
    price: 45000,
    estimatedDays: '1-2',
  },
  {
    id: 'sicepat-reg',
    name: 'SiCepat REG',
    description: '2-3 hari kerja',
    price: 20000,
    estimatedDays: '2-3',
  },
];

export const FREE_SHIPPING_THRESHOLD = 500000;
