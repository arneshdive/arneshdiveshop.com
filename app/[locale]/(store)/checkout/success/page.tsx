'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { CheckoutSuccessContent } from './checkout-success-content';

function SuccessFallback() {
  const t = useTranslations('common');
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-neutral-500">{t('loading')}</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
