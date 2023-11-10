'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils/cn';
import { AnimatedButton } from '@/components/ui/animated-button';
import { EmptyState } from '@/components/ui/empty-state';
import { MapModal } from '@/components/checkout/map-modal';
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

interface AddressCardProps {
  address: Address;
  onSetDefault: (id: string) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

function AddressCard({ address, onSetDefault, onEdit, onDelete }: AddressCardProps) {
  return (
    <div className={cn(
      'bg-neutral-50 p-6 rounded-xl',
      address.isDefault && 'ring-2 ring-neutral-900'
    )}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          {address.name}
        </span>
        {address.isDefault && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600">
            <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
            Utama
          </span>
        )}
      </div>

      <p className="font-medium mb-1">
        {address.firstName} {address.lastName}
      </p>
      <p className="text-sm text-neutral-500 mb-2">{address.phone}</p>
      <p className="text-sm text-neutral-600 leading-relaxed">
        {address.address1}
        {address.address2 && <>, {address.address2}</>}
        <br />
        {address.city}, {address.state} {address.postalCode}
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        {!address.isDefault && (
          <button
            onClick={() => onSetDefault(address.id)}
            className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Jadikan Utama
          </button>
        )}
        <button 
          onClick={onEdit}
          className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          Ubah
        </button>
        <button
          onClick={() => onDelete(address.id)}
          className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

interface AddressFormProps {
  initialData?: Address | null;
  onSave: (data: Partial<Address>) => void;
  onCancel: () => void;
}

function AddressForm({ initialData, onSave, onCancel }: AddressFormProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [hasMapLocation, setHasMapLocation] = useState(!!initialData?.address1);
  
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [fullName, setFullName] = useState(
    initialData ? `${initialData.firstName} ${initialData.lastName}` : ''
  );
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [notes, setNotes] = useState(initialData?.address2 || '');
  
  // Map-derived data (read-only after selection)
  const [address1, setAddress1] = useState(initialData?.address1 || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [postalCode, setPostalCode] = useState(initialData?.postalCode || '');
  const [formattedAddress, setFormattedAddress] = useState('');

  const handleMapSelect = (data: {
    address1: string;
    city: string;
    state: string;
    postalCode: string;
    formattedAddress?: string;
  }) => {
    setAddress1(data.address1);
    setCity(data.city);
    setState(data.state);
    setPostalCode(data.postalCode);
    setFormattedAddress(data.formattedAddress || '');
    setHasMapLocation(true);
  };

  const handleSave = () => {
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    onSave({
      name,
      firstName,
      lastName,
      phone,
      address1,
      address2: notes || undefined,
      city,
      state,
      postalCode,
    });
  };

  const isValid = name.trim() && fullName.trim() && phone.trim() && hasMapLocation;

  return (
    <div className="bg-neutral-50 p-8 rounded-xl">
      <h2 className="text-xl font-semibold tracking-tight mb-6">
        {initialData ? 'Ubah Alamat' : 'Tambah Alamat Baru'}
      </h2>

      <div className="space-y-6">
        {/* Address Name */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Nama Alamat <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="contoh: Rumah, Kantor, Kos"
            className="w-full max-w-xs px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>

        {/* Receiver Name */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Nama Penerima <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama lengkap penerima"
            className="w-full max-w-md px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Nomor Telepon <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+62 812-XXXX-XXXX"
            className="w-full max-w-xs px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>

        {/* Map Selection */}
        {!hasMapLocation ? (
          <div className="py-8 text-center border-2 border-dashed border-neutral-200 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
              <Icon icon="solar:map-point-linear" className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-base font-medium mb-2">Pilih Lokasi Pengiriman</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-4">
              Tentukan lokasi pengiriman Anda dengan menandai di peta.
            </p>
            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
            >
              <Icon icon="solar:map-point-linear" className="w-5 h-5" />
              Cari di Peta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Address - Read Only */}
            <div className="p-4 bg-white border border-neutral-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <Icon icon="solar:map-point-bold" className="w-5 h-5 text-neutral-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-500 mb-1">Alamat Pengiriman</p>
                  <p className="text-sm font-medium leading-relaxed">
                    {formattedAddress || `${address1}, ${city}, ${state} ${postalCode}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Ubah
                </button>
              </div>
            </div>

            {/* Additional Details - Optional */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
                Detail Tambahan <span className="text-neutral-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nama gedung, nomor apartemen, RT/RW, patokan..."
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
              />
              <p className="text-xs text-neutral-400 mt-2">
                Tambahkan detail yang bisa membantu kurir menemukan lokasi Anda
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <AnimatedButton 
          onClick={handleSave}
          disabled={!isValid}
          className="px-6 py-2.5 text-sm"
        >
          Simpan Alamat
        </AnimatedButton>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          Batal
        </button>
      </div>

      {/* Map Modal */}
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onAddressSelect={handleMapSelect}
      />
    </div>
  );
}
