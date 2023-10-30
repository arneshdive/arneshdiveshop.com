// Mock data for account pages - matches db/schema.ts structure

export type OrderStatus = 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  variant?: { color?: string; size?: string };
  quantity: number;
  priceCents: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  createdAt: string;
}

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

// Mock orders
export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ARD-2024-0042',
    status: 'pending_payment',
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
    subtotalCents: 3350000,
    shippingCents: 0,
    discountCents: 0,
    totalCents: 3350000,
    createdAt: '2024-07-02',
  },
  {
    id: '2',
    orderNumber: 'ARD-2024-0041',
    status: 'shipped',
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
    subtotalCents: 1800000,
    shippingCents: 25000,
    discountCents: 0,
    totalCents: 1825000,
    createdAt: '2024-06-28',
  },
  {
    id: '3',
    orderNumber: 'ARD-2024-0040',
    status: 'delivered',
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
    subtotalCents: 450000,
    shippingCents: 25000,
    discountCents: 0,
    totalCents: 475000,
    createdAt: '2024-06-15',
  },
];

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

// Helper to format cents to rupiah
export function formatRupiah(cents: number): string {
  const rupiah = cents;
  return `Rp ${rupiah.toLocaleString('id-ID')}`;
}

// Helper to format date
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Status badge config
export const statusConfig: Record<OrderStatus, { label: string; textClass: string; dotClass: string; pingClass: string }> = {
  pending_payment: { label: 'Perlu Dibayar', textClass: 'text-yellow-700', dotClass: 'bg-yellow-500', pingClass: 'bg-yellow-400' },
  processing: { label: 'Diproses', textClass: 'text-blue-700', dotClass: 'bg-blue-500', pingClass: 'bg-blue-400' },
  shipped: { label: 'Dikirim', textClass: 'text-blue-700', dotClass: 'bg-blue-500', pingClass: 'bg-blue-400' },
  delivered: { label: 'Selesai', textClass: 'text-green-700', dotClass: 'bg-green-500', pingClass: 'bg-green-400' },
  cancelled: { label: 'Dibatalkan', textClass: 'text-red-700', dotClass: 'bg-red-500', pingClass: 'bg-red-400' },
};
