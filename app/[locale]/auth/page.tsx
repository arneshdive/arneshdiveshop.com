'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils/cn';
import { LogoMark } from '@/components/layout/logo-mark';
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

/**
 * Where to send someone once they are signed in.
 *
 * Only same-site paths are honoured: `?redirect=` arrives from the URL bar,
 * so anything else — an absolute URL, or a protocol-relative `//host` that
 * the browser also treats as absolute — would let a link to our own login
 * page bounce people onto someone else's site carrying our branding.
 *
 * The default (no `?redirect=` at all — someone landed here directly)
 * points at `/account` for the *current* locale, since this page itself is
 * locale-prefixed now; a bare `/account` would silently bounce a `/ja/auth`
 * visitor back into the default-locale account pages.
 */
function safeRedirect(target: string | null, locale: string): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return locale === routing.defaultLocale ? '/account' : `/${locale}/account`;
  }
  return target;
}

function AuthForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<AuthForm>({
    email: '',
    name: '',
    otp: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isGeneralSuccess, setIsGeneralSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpExpires, setOtpExpires] = useState(60);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Set once the code has been accepted and the browser is on its way to
  // `redirectTo`. The form stays disabled from that moment: leaving it live
  // during the hop is what let a second submit spend an already-spent code
  // and replace a completed sign-in with "kode sudah digunakan".
  const [isRedirecting, setIsRedirecting] = useState(false);
  // A ref, not state: two submits fired before React re-renders both read
  // the old `isLoading`, and a disabled attribute that lands one frame late
  // stops nothing.
  const submitInFlight = useRef(false);

  const redirectTo = safeRedirect(searchParams.get('redirect'), locale);

  // Tick the resend cooldown down to zero. Guards against rapid repeat
  // requests, each of which would issue a fresh code and invalidate the
  // one the user is probably already reading in their inbox.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const updateForm = (field: keyof AuthForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    setIsGeneralSuccess(false);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.email.trim()) {
      newErrors.email = t('errors.emailRequired');
    } else if (!isValidEmail(form.email)) {
      newErrors.email = t('errors.emailInvalid');
    }

    if (mode === 'register') {
      if (!form.name.trim()) {
        newErrors.name = t('errors.nameRequired');
      }
    }

    if (mode === 'verify-email') {
      if (!form.otp.trim()) {
        newErrors.otp = t('errors.otpRequired');
      } else if (form.otp.length !== 6) {
        newErrors.otp = t('errors.otpInvalidLength');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitInFlight.current || isRedirecting) return;
    if (!validateForm()) return;

    submitInFlight.current = true;
    setIsLoading(true);
    setErrors({});
    setIsGeneralSuccess(false);

    let redirecting = false;

    try {
      if (mode === 'login' || mode === 'register') {
        // Both tabs request the same kind of code; `name` only matters when
        // the account doesn't exist yet.
        const body = mode === 'login'
          ? { email: form.email }
          : { email: form.email, name: form.name };

        const response = await fetch('/api/auth/request-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.details) {
            setErrors(data.details);
          } else {
            setErrors({ general: data.error || t('errors.generic') });
          }
          return;
        }

        setVerifyEmail(form.email.toLowerCase());
        setOtpExpires(data.expires);
        setResendCooldown(30);
        setMode('verify-email');
        setForm((prev) => ({ ...prev, otp: '' }));
      } else if (mode === 'verify-email') {
        const response = await fetch('/api/auth/verify-otp', {
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
            setErrors({ general: data.error || t('errors.generic') });
          }
          return;
        }

        // Signed in. Hand over to the browser rather than the client router:
        // the destination is often /admin, which is slow enough on a cold
        // start that a soft navigation looks like nothing happened at all —
        // no spinner, no address bar movement — and that silence is what
        // prompted people to submit the code a second time. A document
        // request shows the browser's own progress and starts the new page
        // with the session cookie already in hand.
        redirecting = true;
        setIsRedirecting(true);
        window.location.assign(redirectTo);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: t('errors.genericServer') });
    } finally {
      // Not reset while a navigation is under way: the form must not come
      // back to life underneath it and invite a second submit.
      if (!redirecting) {
        submitInFlight.current = false;
        setIsLoading(false);
      }
    }
  };

  const handleBackToLogin = () => {
    setMode('login');
    setErrors({});
    setIsGeneralSuccess(false);
    setForm({ email: '', name: '', otp: '' });
    setResendCooldown(0);
  };

  // Verify Email Form
  if (mode === 'verify-email') {
    return (
      <div className="min-h-screen flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" aria-label={t('brandAlt')} className="inline-block hover:opacity-70 transition-opacity">
              <LogoMark className="h-24 w-auto text-neutral-900" />
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-medium text-neutral-900">{t('verify.title')}</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {t('verify.description')} <strong>{verifyEmail}</strong>
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {t('verify.expiresIn', { minutes: otpExpires })}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OTP */}
            <div>
              <label className="block text-sm text-neutral-500 mb-2">{t('verify.otpLabel')}</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={form.otp}
                onChange={(e) => updateForm('otp', e.target.value.replace(/\D/g, ''))}
                placeholder={t('verify.otpPlaceholder')}
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
              <p className={cn('text-sm text-center', isGeneralSuccess ? 'text-green-600' : 'text-red-500')}>
                {errors.general}
              </p>
            )}

            {/* Submit */}
            <AnimatedButton
              type="submit"
              disabled={isLoading || isRedirecting}
              className="w-full py-3 text-sm"
            >
              {isRedirecting
                ? t('buttons.redirecting')
                : isLoading
                  ? t('buttons.processing')
                  : t('buttons.verify')}
            </AnimatedButton>
          </form>

          {/* Resend OTP */}
          <button
            disabled={isLoading || isRedirecting || resendCooldown > 0}
            onClick={async () => {
              setIsLoading(true);
              try {
                const body = form.name
                  ? { email: verifyEmail, name: form.name }
                  : { email: verifyEmail };

                const response = await fetch('/api/auth/request-otp', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = await response.json();
                if (response.ok) {
                  setErrors({ general: t('success.otpResent') });
                  setIsGeneralSuccess(true);
                  setForm((prev) => ({ ...prev, otp: '' }));
                  setResendCooldown(30);
                } else {
                  setErrors({ general: data.error || t('errors.resendFailed') });
                  setIsGeneralSuccess(false);
                }
              } catch {
                setErrors({ general: t('errors.generic') });
                setIsGeneralSuccess(false);
              } finally {
                setIsLoading(false);
              }
            }}
            className="w-full text-center text-sm text-neutral-600 hover:text-neutral-900 mt-4 disabled:text-neutral-300 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? t('verify.resendWithCooldown', { seconds: resendCooldown })
              : t('verify.resend')}
          </button>

          {/* Back to login */}
          <button
            onClick={handleBackToLogin}
            className="w-full text-center text-sm text-neutral-600 hover:text-neutral-900 mt-2"
          >
            {t('backToLogin')}
          </button>

          {/* Back to store */}
          <Link
            href="/"
            className="w-full text-center text-sm text-neutral-400 hover:text-neutral-600 mt-4 block"
          >
            {t('backToStore')}
          </Link>
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
          <Link href="/" aria-label={t('brandAlt')} className="inline-block hover:opacity-70 transition-opacity">
            <LogoMark className="h-24 w-auto text-neutral-900" />
          </Link>
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
            {t('tabs.login')}
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
            {t('tabs.register')}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register-only fields */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-neutral-500 mb-2">
                {t('fields.fullName')}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder={t('fields.fullNamePlaceholder')}
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
            <label className="block text-sm text-neutral-500 mb-2">{t('fields.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
              placeholder={t('fields.emailPlaceholder')}
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
              isGeneralSuccess ? 'text-green-600' : 'text-red-500'
            )}>{errors.general}</p>
          )}

          {/* Submit */}
          <AnimatedButton
            type="submit"
            disabled={isLoading || isRedirecting}
            className="w-full py-3 text-sm"
          >
            {isLoading
              ? t('buttons.processing')
              : mode === 'login'
                ? t('buttons.login')
                : t('buttons.register')}
          </AnimatedButton>
        </form>

        {/* Terms */}
        <p className="text-xs text-neutral-400 text-center mt-6">
          {t('terms.prefix')}{' '}
          <Link
            href="/syarat"
            className="text-neutral-600 hover:text-neutral-900 underline"
          >
            {t('terms.link')}
          </Link>{' '}
          {t('terms.suffix')}
        </p>

        {/* Back to store */}
        <Link
          href="/"
          className="w-full text-center text-sm text-neutral-400 hover:text-neutral-600 mt-6 block"
        >
          {t('backToStore')}
        </Link>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const t = useTranslations('auth');
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-sm text-neutral-500">{t('loading')}</div>
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
