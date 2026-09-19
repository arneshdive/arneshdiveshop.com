'use client';

import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@iconify/react';

export function EmptyCart() {
  const t = useTranslations('cart');

  return (
    <EmptyState
      icon="solar:sad-circle-linear"
      title={t('empty.title')}
      description={t('empty.description')}
      ctaLabel={t('empty.cta')}
      ctaHref="/produk"
      ctaIcon={<Icon icon="solar:magnifer-linear" className="w-4 h-4" />}
    />
  );
}
