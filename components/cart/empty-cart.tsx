import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@iconify/react';

export function EmptyCart() {
  return (
    <EmptyState
      icon="solar:sad-circle-linear"
      title="Keranjang Kosong"
      description="Belum ada produk di keranjang Anda. Yuk mulai belanja dan temukan perlengkapan diving yang Anda butuhkan."
      ctaLabel="Mulai Belanja"
      ctaHref="/produk"
      ctaIcon={<Icon icon="solar:magnifer-linear" className="w-4 h-4" />}
    />
  );
}
