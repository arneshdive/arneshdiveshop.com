'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@iconify/react';

export function NewsletterForm() {
  const t = useTranslations('newsletter');
  const id = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || t('errors.generic'));
      }
    } catch {
      setStatus('error');
      setMessage(t('errors.generic'));
    }
  };

  return (
    <div className="flex min-w-0 flex-col">
      <h2 className="max-w-sm text-2xl lg:text-[28px] font-semibold leading-tight text-white tracking-tight">
        {t('heading')}
      </h2>
      <p id={`${id}-description`} className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-400">
        {t('description')}
      </p>
      {status !== 'success' && (
        <form
          onSubmit={handleSubmit}
          aria-busy={status === 'loading'}
          className="mt-6 flex w-full min-w-0 items-center rounded-full border border-neutral-700 p-1.5 pl-5 transition-colors focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-400/40"
        >
          <label htmlFor={`${id}-email`} className="sr-only">{t('emailLabel')}</label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            disabled={status === 'loading'}
            aria-invalid={status === 'error'}
            aria-describedby={`${id}-description${status === 'error' ? ` ${id}-status` : ''}`}
            className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-neutral-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading' || !email.trim()}
            aria-label={t('subscribeAria')}
            className="size-10 shrink-0 rounded-full bg-white text-neutral-900 flex items-center justify-center hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon={status === 'loading' ? 'solar:spinner-linear' : 'solar:arrow-right-linear'} aria-hidden="true" className={`size-4${status === 'loading' ? ' motion-safe:animate-spin' : ''}`} />
          </button>
        </form>
      )}
      <div id={`${id}-status`} role="status" aria-live="polite" aria-atomic="true" className="mt-3 text-sm leading-relaxed text-neutral-300 [overflow-wrap:anywhere]">
        {status === 'loading' && <p>{t('subscribing')}</p>}
        {(status === 'success' || status === 'error') && (
          <p>{status === 'success' && <span aria-hidden="true">✓ </span>}{message}</p>
        )}
      </div>
      {status === 'success' && (
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setMessage('');
          }}
          className="mt-3 self-start rounded-sm text-sm text-neutral-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-4 focus-visible:ring-offset-neutral-900"
        >
          {t('subscribeAnother')}
        </button>
      )}
    </div>
  );
}
