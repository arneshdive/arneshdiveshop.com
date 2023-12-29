'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Input, Textarea } from '@/components/admin/input';

interface RajaongkirCity {
  id: string;
  name: string;
  type: string;
  province: string;
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
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cities, setCities] = useState<RajaongkirCity[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

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
        const button = document.querySelector('button[type="submit"]');
        if (button) {
          button.textContent = 'Tersimpan!';
          setTimeout(() => {
            button.textContent = 'Simpan';
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCitySelect = (city: RajaongkirCity) => {
    setSettings(prev => ({
      ...prev,
      rajaongkirCityId: city.id,
      rajaongkirCityName: `${city.type} ${city.name}, ${city.province}`,
    }));
    setCitySearch(`${city.type} ${city.name}, ${city.province}`);
    setShowCityDropdown(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl flex items-center justify-center min-h-[400px]">
        <Icon icon="solar:spinner" className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
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
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="+62 xxx-xxxx-xxxx"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="WhatsApp (tanpa +)"
              value={settings.whatsapp}
              onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
              placeholder="6281234567890"
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
                  onClick={() => {
                    setSettings(prev => ({ ...prev, rajaongkirCityId: null, rajaongkirCityName: null }));
                    setCitySearch('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
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
                        <p className="font-medium text-neutral-900">{city.type} {city.name}</p>
                        <p className="text-xs text-neutral-500">{city.province}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <h2 className="text-base font-medium tracking-tight text-neutral-900">Media Sosial</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Instagram"
              value={settings.instagram || ''}
              onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
              placeholder="username (tanpa @)"
            />
            <Input
              label="TikTok"
              value={settings.tiktok || ''}
              onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
              placeholder="username (tanpa @)"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
