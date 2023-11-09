'use client';

import { useState } from 'react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Input, Textarea } from '@/components/admin/input';

interface ShopSettings {
  storeName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  tiktok: string;
  about: string;
  businessHours: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
}

interface ShippingMethod {
  id: string;
  name: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>({
    storeName: 'Arne\'s Dive Shop',
    email: 'support@arnesdive.com',
    phone: '+62 812-3456-7890',
    whatsapp: '6281234567890',
    address: 'Jl. Dive Center No. 123, Sanur, Bali 80228, Indonesia',
    instagram: 'arnesdiveshop',
    tiktok: 'arnesdiveshop',
    about: 'Premium diving equipment shop serving underwater enthusiasts since 2020. We offer quality freediving and scuba gear from top brands.',
    businessHours: 'Senin – Jumat: 09:00 – 17:00 WIB',
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 'bank_transfer', name: 'Bank Transfer (Virtual Account)', enabled: true },
    { id: 'card', name: 'Credit/Debit Card', enabled: true },
    { id: 'ewallet', name: 'E-Wallet (GoPay, OVO, Dana)', enabled: true },
    { id: 'qris', name: 'QRIS', enabled: true },
  ]);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([
    { id: 'jne', name: 'JNE', enabled: true },
    { id: 'sicepat', name: 'SiCepat', enabled: true },
    { id: 'jnt', name: 'J&T Express', enabled: true },
    { id: 'anteraja', name: 'AnterAja', enabled: false },
    { id: 'ninjaxpress', name: 'Ninja Xpress', enabled: false },
  ]);

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(m => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const toggleShippingMethod = (id: string) => {
    setShippingMethods(methods =>
      methods.map(m => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to database
    console.log('Settings saved:', { settings, paymentMethods, shippingMethods });
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pengaturan</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola informasi toko dan preferensi</p>
        </div>
        <AnimatedButton asChild className="!px-0 !h-12">
          <button type="submit" form="settings-form">
            <span className="text-sm font-medium tracking-wide px-6">Simpan</span>
          </button>
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
            label="Alamat"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            placeholder="Alamat lengkap toko"
            rows={2}
          />

          <Textarea
            label="Tentang toko"
            value={settings.about}
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
              value={settings.instagram}
              onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
              placeholder="username (tanpa @)"
            />
            <Input
              label="TikTok"
              value={settings.tiktok}
              onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
              placeholder="username (tanpa @)"
            />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <h2 className="text-base font-medium tracking-tight text-neutral-900">Metode Pembayaran</h2>
          <p className="text-sm text-neutral-500">Aktifkan metode pembayaran yang tersedia</p>

          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                  method.enabled
                    ? 'bg-neutral-50 border border-neutral-200'
                    : 'border border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={method.enabled}
                  onChange={() => togglePaymentMethod(method.id)}
                  className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span className="text-sm text-neutral-900">{method.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Shipping Methods */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <h2 className="text-base font-medium tracking-tight text-neutral-900">Kurir Pengiriman</h2>
          <p className="text-sm text-neutral-500">Aktifkan kurir yang tersedia</p>

          <div className="space-y-2">
            {shippingMethods.map((method) => (
              <label
                key={method.id}
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                  method.enabled
                    ? 'bg-neutral-50 border border-neutral-200'
                    : 'border border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={method.enabled}
                  onChange={() => toggleShippingMethod(method.id)}
                  className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span className="text-sm text-neutral-900">{method.name}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
