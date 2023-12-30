// Re-export OrderStatus from schema
import type { OrderStatus } from '@/lib/db/schema';
export type { OrderStatus };
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

export interface MockOrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  priceCents: number;
  image?: string;
  variant?: { color?: string; size?: string };
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  items: MockOrderItem[];
  payment: {
    status: PaymentStatus;
    provider: string;
    paymentMethod?: string;
    paidAt?: string;
  };
}

// CONVENTION: All *Cents values are in cents (1 Rupiah = 100 cents)
// Rp 850.000 = 85000000 cents
export const mockOrders: MockOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2025-001',
    status: 'pending_payment',
    subtotalCents: 165000000, // Rp 1.650.000
    shippingCents: 5000000, // Rp 50.000
    taxCents: 0,
    discountCents: 0,
    totalCents: 170000000,
    createdAt: '2026-07-11T10:30:00Z',
    customer: {
      id: 'c1',
      name: 'Budi Santoso',
      email: 'budi.santoso@email.com',
      phone: '+62 812-3456-7890',
    },
    shippingAddress: {
      firstName: 'Budi',
      lastName: 'Santoso',
      address1: 'Jl. Sudirman No. 123',
      address2: 'Apartemen Sudirman Tower, Lt. 5',
      city: 'Jakarta Selatan',
      state: 'DKI Jakarta',
      postalCode: '12190',
      country: 'Indonesia',
      phone: '+62 812-3456-7890',
    },
    items: [
      {
        id: 'i1',
        productId: 'p1',
        name: 'Cressi F1 Freediving Mask',
        quantity: 1,
        priceCents: 45000000, // Rp 450.000
      },
      {
        id: 'i2',
        productId: 'p2',
        name: 'Mares Avanti Quattro Fins',
        quantity: 1,
        priceCents: 120000000, // Rp 1.200.000
      },
    ],
    payment: {
      status: 'pending',
      provider: 'midtrans',
    },
  },
  {
    id: '2',
    orderNumber: 'ORD-2025-002',
    status: 'shipped',
    subtotalCents: 850000000, // Rp 8.500.000
    shippingCents: 0,
    taxCents: 0,
    discountCents: 50000000, // Rp 500.000
    totalCents: 800000000,
    createdAt: '2026-07-11T08:15:00Z',
    customer: {
      id: 'c2',
      name: 'Siti Rahayu',
      email: 'siti.rahayu@email.com',
      phone: '+62 821-9876-5432',
    },
    shippingAddress: {
      firstName: 'Siti',
      lastName: 'Rahayu',
      address1: 'Jl. Gatot Subroto No. 45',
      city: 'Bandung',
      state: 'Jawa Barat',
      postalCode: '40273',
      country: 'Indonesia',
      phone: '+62 821-9876-5432',
    },
    items: [
      {
        id: 'i3',
        productId: 'p4',
        name: 'Scubapro Hydros Pro BCD',
        quantity: 1,
        priceCents: 850000000, // Rp 8.500.000
      },
    ],
    payment: {
      status: 'paid',
      provider: 'midtrans',
      paymentMethod: 'bank_transfer',
      paidAt: '2025-07-11T08:45:00Z',
    },
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-003',
    status: 'shipped',
    subtotalCents: 89000000, // Rp 890.000
    shippingCents: 7500000, // Rp 75.000
    taxCents: 0,
    discountCents: 0,
    totalCents: 96500000,
    createdAt: '2026-07-10T14:20:00Z',
    customer: {
      id: 'c3',
      name: 'Ahmad Wijaya',
      email: 'ahmad.wijaya@email.com',
      phone: '+62 856-2345-6789',
    },
    shippingAddress: {
      firstName: 'Ahmad',
      lastName: 'Wijaya',
      address1: 'Jl. Diponegoro No. 78',
      city: 'Surabaya',
      state: 'Jawa Timur',
      postalCode: '60241',
      country: 'Indonesia',
      phone: '+62 856-2345-6789',
    },
    items: [
      {
        id: 'i4',
        productId: 'p3',
        name: 'Apeks RK3 Fins',
        quantity: 1,
        priceCents: 89000000, // Rp 890.000
      },
    ],
    payment: {
      status: 'paid',
      provider: 'midtrans',
      paymentMethod: 'credit_card',
      paidAt: '2025-07-10T14:35:00Z',
    },
  },
  {
    id: '4',
    orderNumber: 'ORD-2025-004',
    status: 'delivered',
    subtotalCents: 240000000, // Rp 2.400.000
    shippingCents: 5000000, // Rp 50.000
    taxCents: 0,
    discountCents: 20000000, // Rp 200.000
    totalCents: 225000000,
    createdAt: '2026-07-08T09:00:00Z',
    customer: {
      id: 'c4',
      name: 'Dewi Lestari',
      email: 'dewi.lestari@email.com',
      phone: '+62 878-1234-5678',
    },
    shippingAddress: {
      firstName: 'Dewi',
      lastName: 'Lestari',
      address1: 'Jl. Kartini No. 56',
      city: 'Denpasar',
      state: 'Bali',
      postalCode: '80234',
      country: 'Indonesia',
      phone: '+62 878-1234-5678',
    },
    items: [
      {
        id: 'i5',
        productId: 'p2',
        name: 'Mares Avanti Quattro Fins',
        quantity: 2,
        priceCents: 120000000, // Rp 1.200.000
      },
    ],
    payment: {
      status: 'paid',
      provider: 'midtrans',
      paymentMethod: 'gopay',
      paidAt: '2025-07-08T09:15:00Z',
    },
  },
  {
    id: '5',
    orderNumber: 'ORD-2025-005',
    status: 'cancelled',
    subtotalCents: 45000000, // Rp 450.000
    shippingCents: 5000000, // Rp 50.000
    taxCents: 0,
    discountCents: 0,
    totalCents: 50000000,
    createdAt: '2026-07-07T16:45:00Z',
    customer: {
      id: 'c5',
      name: 'Rudi Hermawan',
      email: 'rudi.hermawan@email.com',
      phone: '+62 813-8765-4321',
    },
    shippingAddress: {
      firstName: 'Rudi',
      lastName: 'Hermawan',
      address1: 'Jl. Ahmad Yani No. 99',
      city: 'Semarang',
      state: 'Jawa Tengah',
      postalCode: '50241',
      country: 'Indonesia',
      phone: '+62 813-8765-4321',
    },
    items: [
      {
        id: 'i6',
        productId: 'p1',
        name: 'Cressi F1 Freediving Mask',
        quantity: 1,
        priceCents: 45000000, // Rp 450.000
      },
    ],
    payment: {
      status: 'expired',
      provider: 'midtrans',
    },
  },
  {
    id: '6',
    orderNumber: 'ORD-2025-006',
    status: 'pending_payment',
    subtotalCents: 178000000, // Rp 1.780.000
    shippingCents: 5000000, // Rp 50.000
    taxCents: 0,
    discountCents: 0,
    totalCents: 183000000,
    createdAt: '2026-07-11T11:00:00Z',
    customer: {
      id: 'c6',
      name: 'Lina Kusuma',
      email: 'lina.kusuma@email.com',
      phone: '+62 822-1111-2222',
    },
    shippingAddress: {
      firstName: 'Lina',
      lastName: 'Kusuma',
      address1: 'Jl. Pahlawan No. 12',
      city: 'Yogyakarta',
      state: 'DIY',
      postalCode: '55212',
      country: 'Indonesia',
      phone: '+62 822-1111-2222',
    },
    items: [
      {
        id: 'i7',
        productId: 'p1',
        name: 'Cressi F1 Freediving Mask',
        quantity: 1,
        priceCents: 45000000, // Rp 450.000
      },
      {
        id: 'i8',
        productId: 'p3',
        name: 'Apeks RK3 Fins',
        quantity: 1,
        priceCents: 89000000, // Rp 890.000
      },
      {
        id: 'i9',
        productId: 'p5',
        name: 'Dive Computer Suunto Zoop',
        quantity: 1,
        priceCents: 44000000, // Rp 440.000
      },
    ],
    payment: {
      status: 'pending',
      provider: 'midtrans',
    },
  },
];
