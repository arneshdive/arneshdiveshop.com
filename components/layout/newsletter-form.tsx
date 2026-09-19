'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@iconify/react';

export function NewsletterForm() {
  const t = useTranslations('newsletter');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setStatus('loading');

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

  if (status === 'success') {
    return (
      <div className="flex flex-col justify-end">
        <p className="text-lg text-white mb-3">✓ {message}</p>
        <button
          onClick={() => setStatus('idle')}
          className="text-sm text-neutral-400 hover:text-white transition-colors"
        >
          {t('subscribeAnother')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-end">
      <p className="text-lg lg:text-xl font-bold text-white tracking-tighter mb-5">
        {t('heading')}
      </p>
      <form onSubmit={handleSubmit} className="flex items-center bg-neutral-900 border border-neutral-800 rounded-full p-1.5 pl-5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          disabled={status === 'loading'}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email.trim()}
          aria-label={t('subscribeAria')}
          className="w-9 h-9 rounded-full bg-white text-neutral-900 flex items-center justify-center hover:bg-neutral-200 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon={status === 'loading' ? 'solar:spinner-linear' : 'solar:arrow-right-linear'} className="w-4 h-4" />
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-red-400 mt-2">{message}</p>
      )}
    </div>
  );
}
