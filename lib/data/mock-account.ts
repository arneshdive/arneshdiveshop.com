// Mock data for account pages - matches db/schema.ts structure
//
// Order shape/status are shared with the admin order list (lib/data/mock-orders.ts) —
// this file only adds the customer-scoped order list ("my orders"), which is a
// different query (filtered to one customer) than admin's "all orders", not a
// different data shape.

import type { MockOrder, OrderStatus } from '@/lib/data/mock-orders';

export type { OrderStatus };

export interface Address {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Mock addresses
export const mockAddresses: Address[] = [
  {
    id: '1',
    name: 'Rumah',
    firstName: 'Ahmad',
    lastName: 'Diver',
    phone: '+62 812-3456-7890',
    address1: 'Jl. Sudirman No. 123, RT 05/RW 02',
    address2: 'Kelurahan Menteng',
    city: 'Jakarta Pusat',
    state: 'DKI Jakarta',
    postalCode: '10310',
    country: 'Indonesia',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Kantor',
    firstName: 'Ahmad',
    lastName: 'Diver',
    phone: '+62 812-3456-7890',
    address1: 'Jl. Gatot Subroto No. 45, Apartment Sudirman Tower Lt. 15',
    city: 'Jakarta Selatan',
    state: 'DKI Jakarta',
    postalCode: '12190',
    country: 'Indonesia',
    isDefault: false,
  },
];

// Mock user settings
export const mockUserSettings = {
  firstName: 'Ahmad',
  lastName: 'Diver',
  email: 'ahmad@email.com',
  phone: '+62 812-3456-7890',
  notifications: {
    promoEmail: true,
    orderUpdates: true,
    newsletter: false,
  },
};

const homeAddress = mockAddresses[0]!;

const customer = {
  id: 'ahmad-diver',
  name: `${mockUserSettings.firstName} ${mockUserSettings.lastName}`,
  email: mockUserSettings.email,
  phone: mockUserSettings.phone,
};

const shippingAddress = {
  firstName: homeAddress.firstName,
  lastName: homeAddress.lastName,
  address1: homeAddress.address1,
  address2: homeAddress.address2,
  city: homeAddress.city,
  state: homeAddress.state,
  postalCode: homeAddress.postalCode,
  country: homeAddress.country,
  phone: homeAddress.phone,
};

// Mock orders — "my orders" for the logged-in customer above.
export const mockOrders: MockOrder[] = [
  {
    id: '1',
    orderNumber: 'ARD-2024-0042',
    status: 'pending_payment',
    subtotalCents: 3350000,
    shippingCents: 0,
    taxCents: 0,
    discountCents: 0,
    totalCents: 3350000,
    createdAt: '2024-07-02',
    customer,
    shippingAddress,
    items: [
      {
        id: '1-1',
        productId: 'p1',
        name: 'Masker Freediving Pro',
        image: '/product-sample-1.webp',
        variant: { color: 'Hitam' },
        quantity: 1,
        priceCents: 850000,
      },
      {
        id: '1-2',
        productId: 'p2',
        name: 'Fin Carbón Pro',
        image: '/product-sample-2.webp',
        variant: { size: '42-43' },
        quantity: 1,
        priceCents: 2500000,
      },
    ],
    payment: {
      status: 'pending',
      provider: 'midtrans',
    },
  },
  {
    id: '2',
    orderNumber: 'ARD-2024-0041',
    status: 'shipped',
    subtotalCents: 1800000,
    shippingCents: 25000,
    taxCents: 0,
    discountCents: 0,
    totalCents: 1825000,
    createdAt: '2024-06-28',
    customer,
    shippingAddress,
    items: [
      {
        id: '2-1',
        productId: 'p3',
        name: 'Wetsuit 3mm Premium',
        image: '/instagram-1.jpg',
        variant: { size: 'L' },
        quantity: 1,
        priceCents: 1800000,
      },
    ],
    payment: {
      status: 'paid',
      provider: 'midtrans',
      paymentMethod: 'bank_transfer',
      paidAt: '2024-06-28',
    },
  },
  {
    id: '3',
    orderNumber: 'ARD-2024-0040',
    status: 'delivered',
    subtotalCents: 450000,
    shippingCents: 25000,
    taxCents: 0,
    discountCents: 0,
    totalCents: 475000,
    createdAt: '2024-06-15',
    customer,
    shippingAddress,
    items: [
      {
        id: '3-1',
        productId: 'p4',
        name: 'Sabuk Pemberat Stainless',
        image: '/instagram-2.jpg',
        quantity: 1,
        priceCents: 450000,
      },
    ],
    payment: {
      status: 'paid',
      provider: 'midtrans',
      paymentMethod: 'gopay',
      paidAt: '2024-06-15',
    },
  },
];

// Status badge config — account page uses a ping-dot style, distinct from the
// admin pill style in lib/constants/order-status.ts, so kept separate.
export const statusConfig: Record<OrderStatus, { label: string; textClass: string; dotClass: string; pingClass: string }> = {
  pending_payment: { label: 'Perlu Dibayar', textClass: 'text-yellow-700', dotClass: 'bg-yellow-500', pingClass: 'bg-yellow-400' },
  processing: { label: 'Diproses', textClass: 'text-blue-700', dotClass: 'bg-blue-500', pingClass: 'bg-blue-400' },
  shipped: { label: 'Dikirim', textClass: 'text-blue-700', dotClass: 'bg-blue-500', pingClass: 'bg-blue-400' },
  delivered: { label: 'Selesai', textClass: 'text-green-700', dotClass: 'bg-green-500', pingClass: 'bg-green-400' },
  cancelled: { label: 'Dibatalkan', textClass: 'text-red-700', dotClass: 'bg-red-500', pingClass: 'bg-red-400' },
  refunded: { label: 'Dikembalikan', textClass: 'text-red-700', dotClass: 'bg-red-500', pingClass: 'bg-red-400' },
};
