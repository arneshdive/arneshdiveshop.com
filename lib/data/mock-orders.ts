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

export const mockOrders: MockOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2025-001',
    status: 'pending_payment',
    subtotalCents: 1650000,
    shippingCents: 50000,
    taxCents: 0,
    discountCents: 0,
    totalCents: 1700000,
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
        priceCents: 450000,
      },
      {
        id: 'i2',
        productId: 'p2',
        name: 'Mares Avanti Quattro Fins',
        quantity: 1,
        priceCents: 1200000,
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
    subtotalCents: 8500000,
    shippingCents: 0,
    taxCents: 0,
    discountCents: 500000,
    totalCents: 8000000,
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
        priceCents: 8500000,
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
    subtotalCents: 890000,
    shippingCents: 75000,
    taxCents: 0,
    discountCents: 0,
    totalCents: 965000,
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
        priceCents: 890000,
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
    subtotalCents: 2400000,
    shippingCents: 50000,
    taxCents: 0,
    discountCents: 200000,
    totalCents: 2250000,
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
        priceCents: 1200000,
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
    subtotalCents: 450000,
    shippingCents: 50000,
    taxCents: 0,
    discountCents: 0,
    totalCents: 500000,
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
        priceCents: 450000,
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
    subtotalCents: 1780000,
    shippingCents: 50000,
    taxCents: 0,
    discountCents: 0,
    totalCents: 1830000,
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
        priceCents: 450000,
      },
      {
        id: 'i8',
        productId: 'p3',
        name: 'Apeks RK3 Fins',
        quantity: 1,
        priceCents: 890000,
      },
      {
        id: 'i9',
        productId: 'p5',
        name: 'Dive Computer Suunto Zoop',
        quantity: 1,
        priceCents: 440000,
      },
    ],
    payment: {
      status: 'pending',
      provider: 'midtrans',
    },
  },
];
