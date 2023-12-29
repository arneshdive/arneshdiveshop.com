import { EmptyState } from '@/components/ui/empty-state';

export function EmptyCart() {
  return (
    <EmptyState
      icon="solar:bag-3-linear"
      title="Keranjang Kosong"
      description="Belum ada produk di keranjang belanja Anda. Yuk mulai belanja dan temukan perlengkapan diving terbaik!"
      ctaLabel="Mulai Belanja"
      ctaHref="/produk"
    />
  );
}
