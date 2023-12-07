'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { AnimatedButton } from '@/components/ui/animated-button';
import { isValidEmail } from '@/lib/utils/validators';

type Mode = 'login' | 'register' | 'verify-email';

interface AuthForm {
  email: string;
  name: string;
  otp: string;
}

interface FormErrors {
  email?: string;
  name?: string;
  otp?: string;
  general?: string;
}

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<AuthForm>({
    email: '',
    name: '',
    otp: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [otpExpires, setOtpExpires] = useState(15);
  const [verifyEmail, setVerifyEmail] = useState('');

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

    if (mode === 'register') {
      if (!form.name.trim()) {
        newErrors.name = 'Nama wajib diisi';
      }
    }

    if (mode === 'verify-email') {
      if (!form.otp.trim()) {
        newErrors.otp = 'Kode OTP wajib diisi';
      } else if (form.otp.length !== 6) {
        newErrors.otp = 'Kode OTP harus 6 digit';
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
      if (mode === 'login' || mode === 'register') {
        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const body = mode === 'login'
          ? { email: form.email }
          : { email: form.email, name: form.name };

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

        // After login/register, go to verify email
        setVerifyEmail(form.email.toLowerCase());
        setOtpExpires(data.expires || 15);
        setMode('verify-email');
        setForm((prev) => ({ ...prev, otp: '' }));
      } else if (mode === 'verify-email') {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: verifyEmail,
            otp: form.otp,
          }),
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

        // Success - redirect to account
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'Terjadi kesalahan pada server' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMode('login');
    setErrors({});
    setForm({ email: '', name: '', otp: '' });
  };

  // Verify Email Form
  if (mode === 'verify-email') {
    return (
      <div className="min-h-screen flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-2xl font-bold tracking-tight">ARNES DIVE</span>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-medium text-neutral-900">Verifikasi Email</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Masukkan kode OTP yang dikirim ke <strong>{verifyEmail}</strong>
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Kode berlaku {otpExpires} menit
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OTP */}
            <div>
              <label className="block text-sm text-neutral-500 mb-2">Kode OTP</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={form.otp}
                onChange={(e) => updateForm('otp', e.target.value.replace(/\D/g, ''))}
                placeholder="Masukkan 6 digit kode OTP"
                autoFocus
                className={cn(
                  'w-full px-4 py-3 bg-white border rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none transition-colors',
                  errors.otp
                    ? 'border-red-300 focus:border-2 focus:border-red-500'
                    : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
                )}
              />
              {errors.otp && (
                <p className="text-xs text-red-500 mt-1">{errors.otp}</p>
              )}
            </div>

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
              {isLoading ? 'Memproses...' : 'Verifikasi'}
            </AnimatedButton>
          </form>

          {/* Resend OTP */}
          <button
            onClick={async () => {
              setIsLoading(true);
              try {
                const response = await fetch('/api/auth/send-verification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: verifyEmail }),
                });
                const data = await response.json();
                if (response.ok) {
                  setErrors({ general: 'Kode OTP baru telah dikirim' });
                } else {
                  setErrors({ general: data.error || 'Gagal mengirim ulang' });
                }
              } catch {
                setErrors({ general: 'Terjadi kesalahan' });
              } finally {
                setIsLoading(false);
              }
            }}
            className="w-full text-center text-sm text-neutral-600 hover:text-neutral-900 mt-4"
          >
            Kirim ulang kode OTP
          </button>

          {/* Back to login */}
          <button
            onClick={handleBackToLogin}
            className="w-full text-center text-sm text-neutral-600 hover:text-neutral-900 mt-2"
          >
            ← Kembali ke login
          </button>
        </div>
      </div>
    );
  }

  // Login / Register Form
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

          {/* General Error / Success */}
          {errors.general && (
            <p className={cn(
              'text-sm text-center',
              errors.general.includes('berhasil') ? 'text-green-600' : 'text-red-500'
            )}>{errors.general}</p>
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
