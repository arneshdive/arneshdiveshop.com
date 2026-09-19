'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
// NOTE: thrown messages below are stable error codes mapped to translated
// copy at display time in the component; server-provided `error.error`
// messages (when present) are passed through as-is.
async function fetchProfile(): Promise<{ profile: UserProfile }> {
  const response = await fetch('/api/account/profile');
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('FETCH_FAILED');
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
    throw new Error(error.error || 'UPDATE_FAILED');
  }
  return response.json();
}

// Map a stable error code to its translated copy; pass through anything else
// (a message the server sent) unchanged.
function translateProfileError(t: ReturnType<typeof useTranslations>, message: string): string {
  const codes: Record<string, string> = {
    UNAUTHORIZED: t('settings.errors.unauthorized'),
    FETCH_FAILED: t('settings.errors.loadFailed'),
    UPDATE_FAILED: t('settings.errors.updateFailed'),
  };
  return codes[message] ?? message;
}

export default function SettingsPage() {
  const t = useTranslations('account');
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
      toast.success(t('settings.toast.saved'));
    },
    onError: (error: Error) => {
      toast.error(translateProfileError(t, error.message));
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
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">{t('settings.title')}</h1>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-500">{t('settings.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - not logged in
  if (error?.message === 'UNAUTHORIZED') {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">{t('settings.title')}</h1>
        <div className="bg-neutral-50 p-8 rounded-xl text-center">
          <p className="text-neutral-500">{t('settings.loginRequired.description')}</p>
          <AnimatedButton asChild className="mt-4">
            <a href="/auth">{t('settings.loginRequired.cta')}</a>
          </AnimatedButton>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">{t('settings.title')}</h1>
        <div className="bg-neutral-50 p-8 rounded-xl text-center">
          <p className="text-red-600">{translateProfileError(t, error.message)}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 text-sm text-neutral-600 hover:text-neutral-900 underline"
          >
            {t('settings.errors.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8">{t('settings.title')}</h1>

      {/* Profile Section */}
      <div className="bg-neutral-50 p-6 md:p-8 rounded-xl mb-6">
        <h2 className="text-xl font-semibold tracking-tight mb-6">{t('settings.profile.title')}</h2>

        {/* Avatar */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-neutral-200 flex items-center justify-center text-2xl font-medium text-neutral-500">
            {firstName?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="text-center sm:text-left">
            <p className="font-medium mb-1">{t('settings.profile.photoLabel')}</p>
            <p className="text-sm text-neutral-500 mb-3">{t('settings.profile.photoHint')}</p>
            <button className="px-4 py-2 text-sm border border-neutral-300 rounded-xl hover:border-neutral-900 transition-colors">
              {t('settings.profile.uploadPhoto')}
            </button>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
              {t('settings.profile.firstName')} <span className="text-red-500">*</span>
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
              {t('settings.profile.lastName')} <span className="text-red-500">*</span>
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
            {t('settings.profile.email')}
          </label>
          <input
            type="email"
            value={profile?.email || ''}
            readOnly
            className="w-full md:max-w-md px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-500 cursor-not-allowed"
          />
          <p className="text-xs text-neutral-400 mt-2">
            {t('settings.profile.emailHint')}
          </p>
        </div>

        {/* Phone */}
        <div className="mb-8">
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
            {t('settings.profile.phone')} <span className="text-red-500">*</span>
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
          {updateMutation.isPending ? t('settings.profile.saving') : t('settings.profile.save')}
        </AnimatedButton>
      </div>

      {/* Security Section */}
      <div className="bg-neutral-50 p-6 md:p-8 rounded-xl mb-6">
        <h2 className="text-xl font-semibold tracking-tight mb-6">{t('settings.security.title')}</h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium mb-1">{t('settings.security.passwordLabel')}</p>
            <p className="text-sm text-neutral-500">{t('settings.security.passwordHint')}</p>
          </div>
          <AnimatedButton variant="outline" className="px-5 py-2.5 text-sm w-full sm:w-auto">
            {t('settings.security.changePassword')}
          </AnimatedButton>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 p-6 md:p-8 rounded-xl border border-red-200">
        <h2 className="text-xl font-semibold tracking-tight text-red-600 mb-4">{t('settings.danger.title')}</h2>
        <p className="text-sm text-neutral-600 mb-6">
          {t('settings.danger.description')}
        </p>
        <button className="px-5 py-2.5 text-sm text-red-500 border border-red-300 rounded-xl hover:bg-red-100 transition-colors w-full sm:w-auto">
          {t('settings.danger.deleteAccount')}
        </button>
      </div>
    </div>
  );
}
