export interface MockCustomerAddress {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface MockCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
  addresses: MockCustomerAddress[];
}

export const mockCustomers: MockCustomer[] = [
  {
    id: 'c1',
    firstName: 'Budi',
    lastName: 'Santoso',
    email: 'budi.santoso@email.com',
    phone: '+62 812-3456-7890',
    createdAt: '2026-07-11T10:30:00Z',
    addresses: [
      {
        id: 'a1',
        firstName: 'Budi',
        lastName: 'Santoso',
        address1: 'Jl. Sudirman No. 123',
        address2: 'Apartemen Sudirman Tower, Lt. 5',
        city: 'Jakarta Selatan',
        state: 'DKI Jakarta',
        postalCode: '12190',
        country: 'Indonesia',
        phone: '+62 812-3456-7890',
        isDefault: true,
      },
    ],
  },
  {
    id: 'c2',
    firstName: 'Siti',
    lastName: 'Rahayu',
    email: 'siti.rahayu@email.com',
    phone: '+62 821-9876-5432',
    createdAt: '2026-07-11T08:15:00Z',
    addresses: [
      {
        id: 'a2',
        firstName: 'Siti',
        lastName: 'Rahayu',
        address1: 'Jl. Gatot Subroto No. 45',
        city: 'Bandung',
        state: 'Jawa Barat',
        postalCode: '40273',
        country: 'Indonesia',
        phone: '+62 821-9876-5432',
        isDefault: true,
      },
    ],
  },
  {
    id: 'c3',
    firstName: 'Ahmad',
    lastName: 'Wijaya',
    email: 'ahmad.wijaya@email.com',
    phone: '+62 856-2345-6789',
    createdAt: '2026-07-10T14:20:00Z',
    addresses: [
      {
        id: 'a3',
        firstName: 'Ahmad',
        lastName: 'Wijaya',
        address1: 'Jl. Diponegoro No. 78',
        city: 'Surabaya',
        state: 'Jawa Timur',
        postalCode: '60241',
        country: 'Indonesia',
        phone: '+62 856-2345-6789',
        isDefault: true,
      },
    ],
  },
  {
    id: 'c4',
    firstName: 'Dewi',
    lastName: 'Lestari',
    email: 'dewi.lestari@email.com',
    phone: '+62 878-1234-5678',
    createdAt: '2026-07-08T09:00:00Z',
    addresses: [
      {
        id: 'a4',
        firstName: 'Dewi',
        lastName: 'Lestari',
        address1: 'Jl. Kartini No. 56',
        city: 'Denpasar',
        state: 'Bali',
        postalCode: '80234',
        country: 'Indonesia',
        phone: '+62 878-1234-5678',
        isDefault: true,
      },
    ],
  },
  {
    id: 'c5',
    firstName: 'Rudi',
    lastName: 'Hermawan',
    email: 'rudi.hermawan@email.com',
    phone: '+62 813-8765-4321',
    createdAt: '2026-07-07T16:45:00Z',
    addresses: [
      {
        id: 'a5',
        firstName: 'Rudi',
        lastName: 'Hermawan',
        address1: 'Jl. Ahmad Yani No. 99',
        city: 'Semarang',
        state: 'Jawa Tengah',
        postalCode: '50241',
        country: 'Indonesia',
        phone: '+62 813-8765-4321',
        isDefault: true,
      },
    ],
  },
  {
    id: 'c6',
    firstName: 'Lina',
    lastName: 'Kusuma',
    email: 'lina.kusuma@email.com',
    phone: '+62 822-1111-2222',
    createdAt: '2026-07-11T11:00:00Z',
    addresses: [
      {
        id: 'a6',
        firstName: 'Lina',
        lastName: 'Kusuma',
        address1: 'Jl. Pahlawan No. 12',
        city: 'Yogyakarta',
        state: 'DIY',
        postalCode: '55212',
        country: 'Indonesia',
        phone: '+62 822-1111-2222',
        isDefault: true,
      },
    ],
  },
  {
    id: 'c7',
    firstName: 'Andi',
    lastName: 'Pratama',
    email: 'andi.pratama@email.com',
    phone: '+62 857-9999-8888',
    createdAt: '2026-07-05T13:30:00Z',
    addresses: [],
  },
  {
    id: 'c8',
    firstName: 'Maya',
    lastName: 'Sari',
    email: 'maya.sari@email.com',
    createdAt: '2026-07-04T09:15:00Z',
    addresses: [],
  },
];
