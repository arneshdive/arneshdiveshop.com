'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { AnimatedButton } from '@/components/ui/animated-button';
import { isValidEmail } from '@/lib/utils/validators';

type Mode = 'login' | 'register';

interface AuthForm {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  confirmPassword?: string;
  general?: string;
}

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<AuthForm>({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/account';

  const updateForm = (field: keyof AuthForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!isValidEmail(form.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!form.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }

    if (mode === 'register') {
      if (!form.name.trim()) {
        newErrors.name = 'Nama wajib diisi';
      }

      if (!form.confirmPassword) {
        newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
      } else if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'Password tidak cocok';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : {
              email: form.email,
              password: form.password,
              name: form.name,
            };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors({ general: data.error || 'Terjadi kesalahan' });
        }
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'Terjadi kesalahan pada server' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight">ARNES DIVE</span>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
          <button
            onClick={() => setMode('login')}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
              mode === 'login'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500'
            )}
          >
            Masuk
          </button>
          <button
            onClick={() => setMode('register')}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
              mode === 'register'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500'
            )}
          >
            Daftar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register-only fields */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-neutral-500 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="Nama lengkap Anda"
                className={cn(
                  'w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none transition-colors',
                  errors.name
                    ? 'border-red-300 focus:border-2 focus:border-red-500'
                    : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
              placeholder="email@contoh.com"
              autoFocus={mode === 'login'}
              className={cn(
                'w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none transition-colors',
                errors.email
                  ? 'border-red-300 focus:border-2 focus:border-red-500'
                  : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-neutral-500 mb-2">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateForm('password', e.target.value)}
              placeholder="Masukkan password"
              className={cn(
                'w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none transition-colors',
                errors.password
                  ? 'border-red-300 focus:border-2 focus:border-red-500'
                  : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
              )}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password (register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-neutral-500 mb-2">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateForm('confirmPassword', e.target.value)}
                placeholder="Ulangi password"
                className={cn(
                  'w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none transition-colors',
                  errors.confirmPassword
                    ? 'border-red-300 focus:border-2 focus:border-red-500'
                    : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
                )}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <p className="text-sm text-red-500 text-center">{errors.general}</p>
          )}

          {/* Submit */}
          <AnimatedButton
            type="submit"
            disabled={isLoading}
            className="w-full py-3 text-sm"
          >
            {isLoading
              ? 'Memproses...'
              : mode === 'login'
                ? 'Masuk'
                : 'Daftar'}
          </AnimatedButton>
        </form>

        {/* Forgot password placeholder */}
        {mode === 'login' && (
          <p className="text-xs text-center text-neutral-400 mt-4">
            Lupa password?{' '}
            <span className="text-neutral-600 cursor-not-allowed">
              Fitur coming soon
            </span>
          </p>
        )}

        {/* Terms */}
        <p className="text-xs text-neutral-400 text-center mt-6">
          Dengan melanjutkan, Anda menyetujui{' '}
          <a
            href="/syarat-ketentuan"
            className="text-neutral-600 hover:text-neutral-900 underline"
          >
            Syarat & Ketentuan
          </a>{' '}
          kami
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-sm text-neutral-500">Loading...</div>
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
