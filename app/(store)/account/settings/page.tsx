'use client';

import { useState } from 'react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { mockUserSettings } from '@/lib/data/mock-account';

export default function SettingsPage() {
  const [settings, setSettings] = useState(mockUserSettings);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">Pengaturan Akun</h1>

      {/* Profile Section */}
      <div className="bg-neutral-50 p-6 md:p-8 rounded-xl mb-6">
        <h2 className="text-xl font-semibold tracking-tight mb-6">Profil</h2>

        {/* Avatar */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-neutral-200 flex items-center justify-center text-2xl font-medium text-neutral-500">
            {settings.firstName[0]}
          </div>
          <div className="text-center sm:text-left">
            <p className="font-medium mb-1">Foto Profil</p>
            <p className="text-sm text-neutral-500 mb-3">JPG, PNG. Maksimal 2MB</p>
            <button className="px-4 py-2 text-sm border border-neutral-300 rounded-xl hover:border-neutral-900 transition-colors">
              Unggah Foto
            </button>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
              Nama Depan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.firstName}
              onChange={(e) => setSettings({ ...settings, firstName: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
              Nama Belakang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.lastName}
              onChange={(e) => setSettings({ ...settings, lastName: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Email
          </label>
          <input
            type="email"
            value={settings.email}
            readOnly
            className="w-full md:max-w-md px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-500 cursor-not-allowed"
          />
          <p className="text-xs text-neutral-400 mt-2">
            Alamat email digunakan untuk login dan tidak dapat diubah
          </p>
        </div>

        {/* Phone */}
        <div className="mb-8">
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            Nomor Telepon <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={settings.phone}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            className="w-full md:max-w-md px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>

        <AnimatedButton className="px-6 py-2.5 text-sm w-full sm:w-auto">
          Simpan Perubahan
        </AnimatedButton>
      </div>

      {/* Security Section */}
      <div className="bg-neutral-50 p-6 md:p-8 rounded-xl mb-6">
        <h2 className="text-xl font-semibold tracking-tight mb-6">Keamanan</h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium mb-1">Kata Sandi</p>
            <p className="text-sm text-neutral-500">Terakhir diubah 3 bulan yang lalu</p>
          </div>
          <AnimatedButton variant="outline" className="px-5 py-2.5 text-sm w-full sm:w-auto">
            Ubah Kata Sandi
          </AnimatedButton>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-neutral-50 p-6 md:p-8 rounded-xl mb-6">
        <h2 className="text-xl font-semibold tracking-tight mb-6">Notifikasi</h2>

        <div className="space-y-6">
          <ToggleRow
            label="Email Promosi"
            description="Terima info promo dan diskon via email"
            checked={settings.notifications.promoEmail}
            onChange={(checked) =>
              setSettings({
                ...settings,
                notifications: { ...settings.notifications, promoEmail: checked },
              })
            }
          />
          <ToggleRow
            label="Notifikasi Pesanan"
            description="Update status pesanan via email dan WhatsApp"
            checked={settings.notifications.orderUpdates}
            onChange={(checked) =>
              setSettings({
                ...settings,
                notifications: { ...settings.notifications, orderUpdates: checked },
              })
            }
          />
          <ToggleRow
            label="Newsletter"
            description="Newsletter mingguan tentang produk baru"
            checked={settings.notifications.newsletter}
            onChange={(checked) =>
              setSettings({
                ...settings,
                notifications: { ...settings.notifications, newsletter: checked },
              })
            }
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 p-6 md:p-8 rounded-xl border border-red-200">
        <h2 className="text-xl font-semibold tracking-tight text-red-600 mb-4">Zona Bahaya</h2>
        <p className="text-sm text-neutral-600 mb-6">
          Menghapus akun akan menghapus semua data Anda secara permanen. Tindakan ini tidak dapat dikembalikan.
        </p>
        <button className="px-5 py-2.5 text-sm text-red-500 border border-red-300 rounded-xl hover:bg-red-100 transition-colors w-full sm:w-auto">
          Hapus Akun Saya
        </button>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex justify-between items-start sm:items-center gap-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${
          checked ? 'bg-neutral-900' : 'bg-neutral-300'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'right-1' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
