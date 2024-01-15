'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatedButton } from '@/components/ui/animated-button';
import { toast } from 'sonner';

// Types matching API response
interface UserProfile {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  customerId: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  totalSpentCents: number | null;
}

// Fetch profile from API
async function fetchProfile(): Promise<{ profile: UserProfile }> {
  const response = await fetch('/api/account/profile');
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Silakan login untuk mengakses pengaturan');
    }
    throw new Error('Gagal memuat profil');
  }
  return response.json();
}

// Update profile mutation
async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<{ profile: UserProfile }> {
  const response = await fetch('/api/account/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal mengubah profil');
  }
  return response.json();
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  
  // Local form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Fetch profile
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  // Sync form state when profile loads
  const profile = data?.profile;
  const [initialized, setInitialized] = useState(false);
  
  if (profile && !initialized) {
    setFirstName(profile.firstName || '');
    setLastName(profile.lastName || '');
    setPhone(profile.phone || '');
    setInitialized(true);
  }

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profil berhasil disimpan');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ firstName, lastName, phone });
  };

  const hasChanges = 
    firstName !== (profile?.firstName || '') ||
    lastName !== (profile?.lastName || '') ||
    phone !== (profile?.phone || '');

  // Loading state
  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">Pengaturan Akun</h1>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-500">Memuat profil...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - not logged in
  if (error?.message.includes('login')) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">Pengaturan Akun</h1>
        <div className="bg-neutral-50 p-8 rounded-xl text-center">
          <p className="text-neutral-500">Silakan login untuk mengakses pengaturan akun</p>
          <AnimatedButton asChild className="mt-4">
            <a href="/auth">Login</a>
          </AnimatedButton>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">Pengaturan Akun</h1>
        <div className="bg-neutral-50 p-8 rounded-xl text-center">
          <p className="text-red-600">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="mt-4 text-sm text-neutral-600 hover:text-neutral-900 underline"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">Pengaturan Akun</h1>

      {/* Profile Section */}
      <div className="bg-neutral-50 p-6 md:p-8 rounded-xl mb-6">
        <h2 className="text-xl font-semibold tracking-tight mb-6">Profil</h2>

        {/* Avatar */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-neutral-200 flex items-center justify-center text-2xl font-medium text-neutral-500">
            {firstName?.[0]?.toUpperCase() || '?'}
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
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
              Nama Belakang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
            value={profile?.email || ''}
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
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full md:max-w-md px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>

        <AnimatedButton 
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="px-6 py-2.5 text-sm w-full sm:w-auto"
        >
          {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
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
