'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Input, Textarea } from '@/components/admin/input';

// Dynamically import the map modal with SSR disabled
const SettingsMapModal = dynamic(
  () => import('@/components/admin/settings-map-modal').then(mod => mod.SettingsMapModal),
  { ssr: false }
);

interface ShopSettingsData {
  storeName: string;
  email: string;
  phone: string;
  whatsapp: string;
  businessHours: string;
  about: string;
  addressFormatted: string | null;
  addressLat: string | null;
  addressLng: string | null;
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
    addressFormatted: null,
    addressLat: null,
    addressLng: null,
    instagram: null,
    tiktok: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

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
            addressFormatted: data.addressFormatted || null,
            addressLat: data.addressLat || null,
            addressLng: data.addressLng || null,
            instagram: data.instagram || '',
            tiktok: data.tiktok || '',
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

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
        // Show success feedback
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

  const handleAddressSelect = (address: {
    addressFormatted: string;
    addressLat: string;
    addressLng: string;
  }) => {
    setSettings(prev => ({
      ...prev,
      addressFormatted: address.addressFormatted,
      addressLat: address.addressLat,
      addressLng: address.addressLng,
    }));
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

          {/* Address with Map Picker */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Alamat Toko
            </label>
            
            {settings.addressFormatted ? (
              <div className="space-y-3">
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center">
                      <Icon icon="solar:map-point-bold" className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-relaxed">
                        {settings.addressFormatted}
                      </p>
                      {settings.addressLat && settings.addressLng && (
                        <p className="text-xs text-neutral-400 mt-1 font-mono">
                          {parseFloat(settings.addressLat).toFixed(6)}, {parseFloat(settings.addressLng).toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <Icon icon="solar:pen-linear" className="w-4 h-4" />
                  Ubah Lokasi
                </button>
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-neutral-200 rounded-xl">
                <div className="w-12 h-12 mx-auto mb-3 bg-neutral-100 rounded-full flex items-center justify-center">
                  <Icon icon="solar:map-point-linear" className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500 mb-3">
                  Tentukan lokasi toko Anda di peta
                </p>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  <Icon icon="solar:map-point-linear" className="w-5 h-5" />
                  Pilih di Peta
                </button>
              </div>
            )}
          </div>

          <Textarea
            label="Tentang toko"
            value={settings.about || ''}
            onChange={(e) => setSettings({ ...settings, about: e.target.value })}
            placeholder="Deskripsi singkat tentang toko Anda"
            rows={3}
          />
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

      {/* Map Modal */}
      <SettingsMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onAddressSelect={handleAddressSelect}
        initialLat={settings.addressLat || undefined}
        initialLng={settings.addressLng || undefined}
        initialAddress={settings.addressFormatted || undefined}
      />
    </div>
  );
}
