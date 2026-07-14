'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Input, Textarea } from '@/components/admin/input';
import { formatPhoneInput } from '@/lib/utils/format';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface RajaongkirCity {
  id: string;
  name: string;
  type: string;
  province: string;
  city?: string;
  district?: string;
  fullName: string;
}

interface ShopSettingsData {
  storeName: string;
  email: string;
  phone: string;
  whatsapp: string;
  businessHours: string;
  about: string;
  rajaongkirCityId: string | null;
  rajaongkirCityName: string | null;
  instagram: string | null;
  tiktok: string | null;
  activeCouriers: string[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettingsData>({
    storeName: '',
    email: '',
    phone: '',
    whatsapp: '',
    businessHours: '',
    about: '',
    rajaongkirCityId: null,
    rajaongkirCityName: null,
    instagram: null,
    tiktok: null,
    activeCouriers: ['jne', 'jnt', 'sicepat'],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cities, setCities] = useState<RajaongkirCity[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Available couriers for toggle UI
  const AVAILABLE_COURIERS = [
    { code: 'jne', name: 'JNE' },
    { code: 'jnt', name: 'J&T Express' },
    { code: 'sicepat', name: 'SiCepat' },
    { code: 'idexpress', name: 'ID Express' },
    { code: 'anteraja', name: 'AnterAja' },
    { code: 'pos', name: 'POS Indonesia' },
    { code: 'tiki', name: 'TIKI' },
  ] as const;

  // Toggle courier on/off
  const toggleCourier = (code: string) => {
    setSettings(prev => {
      const isActive = prev.activeCouriers.includes(code);

      // Prevent unchecking the last courier
      if (isActive && prev.activeCouriers.length === 1) {
        toast.error('Minimal 1 kurir harus aktif');
        return prev;
      }

      return {
        ...prev,
        activeCouriers: isActive
          ? prev.activeCouriers.filter(c => c !== code)
          : [...prev.activeCouriers, code],
      };
    });
  };

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            storeName: data.storeName || '',
            email: data.email || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp || '',
            businessHours: data.businessHours || '',
            about: data.about || '',
            rajaongkirCityId: data.rajaongkirCityId || null,
            rajaongkirCityName: data.rajaongkirCityName || null,
            instagram: data.instagram || '',
            tiktok: data.tiktok || '',
            activeCouriers: data.activeCouriers || ['jne', 'jnt', 'sicepat'],
          });
          if (data.rajaongkirCityName) {
            setCitySearch(data.rajaongkirCityName);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // Fetch cities from local cache
  const fetchCities = async (search: string) => {
    if (!search.trim()) {
      setCities([]);
      return;
    }
    
    setIsLoadingCities(true);
    try {
      const response = await fetch(`/api/shipping/cities?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setCities(data.cities || []);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Debounced city search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showCityDropdown) {
        fetchCities(citySearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [citySearch, showCityDropdown]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        toast.success('Pengaturan berhasil disimpan');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCitySelect = (city: { id: string; name: string; type: string; province: string; city?: string; district?: string; fullName: string }) => {
    setSettings(prev => ({
      ...prev,
      rajaongkirCityId: city.id,
      rajaongkirCityName: city.fullName,
    }));
    setCitySearch(city.fullName);
    setShowCityDropdown(false);
  };

  const handleDeleteLocation = () => {
    setSettings(prev => ({ ...prev, rajaongkirCityId: null, rajaongkirCityName: null }));
    setCitySearch('');
    setShowDeleteDialog(false);
    toast.success('Lokasi berhasil dihapus');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon icon="solar:spinner" className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pengaturan</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola informasi toko dan preferensi</p>
        </div>
        <AnimatedButton type="submit" form="settings-form" size="xs" disabled={isSaving}>
          {isSaving ? 'Menyimpan...' : 'Simpan'}
        </AnimatedButton>
      </div>

      <form id="settings-form" onSubmit={handleSave} className="space-y-6">
        {/* Shop Information */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <h2 className="text-base font-medium tracking-tight text-neutral-900">Informasi Toko</h2>

          <Input
            label="Nama toko"
            value={settings.storeName}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            placeholder="Nama toko Anda"
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              placeholder="email@tokoanda.com"
            />
            <Input
              label="Telepon"
              value={settings.phone}
              onChange={(e) => {
                const formatted = formatPhoneInput(e.target.value);
                setSettings({ ...settings, phone: formatted });
              }}
              placeholder="0812-3456-7890"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="WhatsApp (tanpa +)"
              value={settings.whatsapp}
              onChange={(e) => {
                const formatted = formatPhoneInput(e.target.value);
                setSettings({ ...settings, whatsapp: formatted });
              }}
              placeholder="0812-3456-7890"
            />
            <Input
              label="Jam operasional"
              value={settings.businessHours}
              onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
              placeholder="Senin – Jumat: 09:00 – 17:00 WIB"
            />
          </div>

          <Textarea
            label="Tentang toko"
            value={settings.about || ''}
            onChange={(e) => setSettings({ ...settings, about: e.target.value })}
            placeholder="Deskripsi singkat tentang toko Anda"
            rows={3}
          />
        </div>

        {/* Shipping Origin */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <h2 className="text-base font-medium tracking-tight text-neutral-900">Lokasi Pengiriman</h2>
          <p className="text-sm text-neutral-500">
            Pilih kota asal pengiriman untuk menghitung ongkos kirim
          </p>

          <div className="relative">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Kota Asal
            </label>
            
            {settings.rajaongkirCityId ? (
              <div className="space-y-3">
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center">
                      <Icon icon="solar:map-point-bold" className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-relaxed">
                        {settings.rajaongkirCityName}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1 font-mono">
                        ID: {settings.rajaongkirCityId}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                >
                  <Icon icon="solar:trash-bin-trash-linear" className="w-4 h-4" />
                  Hapus Lokasi
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    placeholder="Cari kota atau kabupaten..."
                    className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
                  />
                  {isLoadingCities && (
                    <Icon icon="solar:spinner" className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-neutral-400" />
                  )}
                </div>

                {/* City Dropdown */}
                {showCityDropdown && cities.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {cities.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
                      >
                        <p className="font-medium text-neutral-900">{city.name}</p>
                        <p className="text-xs text-neutral-500">{city.fullName}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Couriers */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <h2 className="text-base font-medium tracking-tight text-neutral-900">Kurir Pengiriman</h2>
          <p className="text-sm text-neutral-500">
            Pilih kurir yang tersedia untuk pelanggan
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AVAILABLE_COURIERS.map((courier) => {
              const isActive = settings.activeCouriers.includes(courier.code);
              return (
                <label
                  key={courier.code}
                  className={
                    `flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isActive
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`
                  }
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleCourier(courier.code)}
                    className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className={`text-sm font-medium ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`}>
                    {courier.name}
                  </span>
                </label>
              );
            })}
          </div>

          <p className="text-xs text-neutral-400">
            💡 Minimal 1 kurir harus aktif
          </p>
        </div>

      </form>

      {/* Delete Location Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteLocation}
        title="Hapus Lokasi"
        message="Apakah Anda yakin ingin menghapus lokasi pengiriman? Anda perlu mengatur ulang untuk menghitung ongkir."
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  );
}
