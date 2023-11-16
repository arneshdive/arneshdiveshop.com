'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { EmptyState } from '@/components/ui/empty-state';
import { AddressCard } from '@/components/account/address-card';
import { AddressForm } from '@/components/account/address-form';
import { mockAddresses, type Address } from '@/lib/data/mock-account';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    })));
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus alamat ini?')) {
      setAddresses(addresses.filter((addr) => addr.id !== id));
    }
  };

  const handleSaveAddress = (addressData: Partial<Address>) => {
    if (editingAddress) {
      setAddresses(addresses.map((addr) => 
        addr.id === editingAddress.id ? { ...addr, ...addressData } : addr
      ));
    } else {
      const newAddress: Address = {
        id: Date.now().toString(),
        name: addressData.name || '',
        firstName: addressData.firstName || '',
        lastName: addressData.lastName || '',
        phone: addressData.phone || '',
        address1: addressData.address1 || '',
        address2: addressData.address2,
        city: addressData.city || '',
        state: addressData.state || '',
        postalCode: addressData.postalCode || '',
        country: 'Indonesia',
        isDefault: addresses.length === 0,
      };
      setAddresses([...addresses, newAddress]);
    }
    setIsAdding(false);
    setEditingAddress(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Alamat Saya</h1>
        <AnimatedButton
          onClick={() => setIsAdding(true)}
          className="px-5 py-2.5 text-sm"
        >
          <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
          Tambah Alamat
        </AnimatedButton>
      </div>

      {isAdding || editingAddress ? (
        <AddressForm
          initialData={editingAddress}
          onSave={handleSaveAddress}
          onCancel={() => {
            setIsAdding(false);
            setEditingAddress(null);
          }}
        />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon="solar:map-point-linear"
          title="Belum Ada Alamat"
          description="Tambahkan alamat pengiriman untuk memudahkan proses checkout berikutnya."
          ctaLabel="Tambah Alamat"
          onClick={() => setIsAdding(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onSetDefault={handleSetDefault}
              onEdit={() => setEditingAddress(address)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
