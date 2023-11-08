'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { mockCustomers, type MockCustomer } from '@/lib/data/mock-customers';

function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: id });
}

function CustomerListItem({
  customer,
  isSelected,
  onClick,
}: {
  customer: MockCustomer;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl transition-all ${
        isSelected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium tracking-tight text-neutral-900 truncate">
            {customer.firstName} {customer.lastName}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">{customer.email}</p>
        </div>
      </div>
      <p className="text-xs text-neutral-500">{formatRelativeTime(customer.createdAt)}</p>
    </button>
  );
}

function CustomerDetail({ customer }: { customer: MockCustomer | null }) {
  if (!customer) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
          <Icon icon="solar:user-linear" className="w-6 h-6 text-neutral-400" />
        </div>
        <p className="text-neutral-600 font-medium tracking-tight">Pilih Pelanggan</p>
        <p className="text-sm text-neutral-500 mt-1">Pilih pelanggan untuk melihat detail</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Customer Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tighter text-neutral-900">
            {customer.firstName} {customer.lastName}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Bergabung {formatRelativeTime(customer.createdAt)}</p>
        </div>

        {/* Contact Info */}
        <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">Kontak</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Icon icon="solar:letter-linear" className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-700">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Icon icon="solar:phone-linear" className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-700">{customer.phone}</span>
              </div>
            )}
            {!customer.phone && (
              <p className="text-sm text-neutral-400">No phone number</p>
            )}
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-neutral-50 rounded-2xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
            Alamat {customer.addresses.length > 0 && `(${customer.addresses.length})`}
          </h3>
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-neutral-400">Belum ada alamat tersimpan</p>
          ) : (
            <div className="space-y-4">
              {customer.addresses.map((address) => (
                <div key={address.id} className="pb-4 last:pb-0 last:border-0 border-b border-neutral-200 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium tracking-tight text-neutral-900">
                      {address.firstName} {address.lastName}
                    </p>
                    {address.isDefault && (
                      <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full bg-neutral-200 text-neutral-600">
                        Utama
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">
                    <p>{address.address1}{address.address2 && `, ${address.address2}`}</p>
                    <p>
                      {address.city}{address.state && `, ${address.state}`} {address.postalCode}
                    </p>
                    <p>{address.country}</p>
                    {address.phone && <p className="mt-2">{address.phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = mockCustomers.filter((customer) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      return fullName.includes(query) || customer.email.toLowerCase().includes(query);
    }
    return true;
  });

  const selectedCustomer = selectedCustomerId
    ? mockCustomers.find((c) => c.id === selectedCustomerId) ?? null
    : null;

  return (
    <div className="max-w-7xl flex-1 flex flex-col min-h-0">
      {/* Page Header */}
      <div className="mb-8 flex-shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pelanggan</h1>
        <p className="text-sm text-neutral-500 mt-1">Lihat dan kelola data pelanggan</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Customer List */}
      <div className="w-[360px] flex-shrink-0 flex flex-col bg-white rounded-2xl">
        {/* Search */}
        <div className="p-4 pb-0">
          <div className="relative">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
            />
            <input
              type="search"
              placeholder="Cari pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 transition-colors"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-4 pt-3">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 text-sm">Tidak ada pelanggan ditemukan</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <CustomerListItem
                key={customer.id}
                customer={customer}
                isSelected={selectedCustomerId === customer.id}
                onClick={() => setSelectedCustomerId(customer.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right: Customer Detail */}
      <div className="flex-1 min-w-0 bg-white rounded-2xl overflow-hidden">
        <CustomerDetail customer={selectedCustomer} />
      </div>
    </div>
  </div>
  );
}
