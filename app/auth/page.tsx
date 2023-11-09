'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils/cn';
import { AnimatedButton } from '@/components/ui/animated-button';
import { isValidEmail, isValidPhone } from '@/lib/utils/validators';

type Step = 'email' | 'otp' | 'profile';

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const redirectTo = searchParams.get('redirect') || '/account';

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  // Send OTP
  const handleSendOtp = async () => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email wajib diisi');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Format email tidak valid');
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setStep('otp');
    setCountdown(60);
    setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError('');

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit) && newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeydown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setOtp(newOtp);
      if (pastedData.length === 6) {
        handleVerifyOtp(pastedData);
      }
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (otpCode: string) => {
    setIsLoading(true);
    console.log('Verifying OTP:', otpCode);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate: random new/existing user for demo
    const userExists = Math.random() > 0.5;

    setIsLoading(false);

    if (userExists) {
      router.push(redirectTo);
    } else {
      setStep('profile');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    otpInputRefs.current[0]?.focus();
  };

  // Submit profile
  const handleProfileSubmit = async () => {
    setProfileError('');

    if (!fullName.trim()) {
      setProfileError('Nama lengkap wajib diisi');
      return;
    }

    if (!phone.trim()) {
      setProfileError('Nomor telepon wajib diisi');
      return;
    }

    if (!isValidPhone(phone)) {
      setProfileError('Format nomor telepon tidak valid');
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push(redirectTo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight">ARNES DIVE</span>
        </div>

        {/* Email Step */}
        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                placeholder="email@contoh.com"
                autoFocus
                className={cn(
                  'w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none transition-colors',
                  emailError
                    ? 'border-red-300 focus:border-2 focus:border-red-500'
                    : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
                )}
              />
              {emailError && (
                <p className="text-xs text-red-500 mt-2">{emailError}</p>
              )}
            </div>

            <AnimatedButton
              onClick={handleSendOtp}
              disabled={isLoading}
              className="w-full py-3 text-sm"
            >
              {isLoading ? 'Mengirim...' : 'Masuk / Daftar'}
            </AnimatedButton>

            <p className="text-xs text-neutral-400 text-center">
              Dengan melanjutkan, Anda menyetujui{' '}
              <a href="/syarat-ketentuan" className="text-neutral-600 hover:text-neutral-900 underline">
                Syarat & Ketentuan
              </a>
              {' '}kami
            </p>
          </div>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div>
            <p className="text-sm text-neutral-500 text-center mb-6">
              Masukkan kode yang dikirim ke <span className="font-medium text-neutral-900">{email}</span>
            </p>

            <div className="flex justify-center gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpInputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeydown(index, e)}
                  onPaste={handleOtpPaste}
                  className={cn(
                    'w-11 h-11 text-center text-lg font-medium bg-white border rounded-lg focus:outline-none transition-colors',
                    otpError
                      ? 'border-red-300 focus:border-2 focus:border-red-500'
                      : 'border-neutral-300 focus:border-2 focus:border-neutral-900'
                  )}
                />
              ))}
            </div>

            {otpError && (
              <p className="text-xs text-red-500 text-center mb-4">{otpError}</p>
            )}

            {isLoading && (
              <p className="text-xs text-neutral-500 text-center mb-4">Memverifikasi...</p>
            )}

            <div className="text-center mb-6">
              <button
                onClick={handleResendOtp}
                disabled={countdown > 0 || isLoading}
                className={cn(
                  'text-sm transition-colors',
                  countdown > 0 || isLoading
                    ? 'text-neutral-400 cursor-not-allowed'
                    : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : 'Kirim Ulang Kode'}
              </button>
            </div>

            <button
              onClick={() => {
                setStep('email');
                setOtp(['', '', '', '', '', '']);
                setOtpError('');
              }}
              className="w-full text-sm text-neutral-500 hover:text-neutral-900 transition-colors text-center"
            >
              <Icon icon="solar:arrow-left-linear" className="w-4 h-4 inline mr-1" />
              Ganti Email
            </button>
          </div>
        )}

        {/* Profile Step */}
        {step === 'profile' && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500 text-center mb-2">
              Lengkapi profil Anda untuk melanjutkan
            </p>

            <div>
              <label className="block text-sm text-neutral-500 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setProfileError('');
                }}
                placeholder="Nama lengkap Anda"
                autoFocus
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-sm focus:border-2 focus:border-neutral-900 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-500 mb-2">
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setProfileError('');
                }}
                placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-sm focus:border-2 focus:border-neutral-900 focus:outline-none transition-colors"
              />
            </div>

            {profileError && (
              <p className="text-xs text-red-500">{profileError}</p>
            )}

            <AnimatedButton
              onClick={handleProfileSubmit}
              disabled={isLoading}
              className="w-full py-3 text-sm"
            >
              {isLoading ? 'Memproses...' : 'Selesai'}
            </AnimatedButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-neutral-500">Loading...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
