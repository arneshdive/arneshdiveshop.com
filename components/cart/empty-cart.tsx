import Link from 'next/link';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 lg:py-24 text-center">
      <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-8">
        <Icon icon="solar:bag-3-linear" className="w-12 h-12 text-neutral-300" />
      </div>
      <h2 className="text-2xl lg:text-3xl font-bold tracking-tighter mb-3">
        Keranjang Kosong
      </h2>
      <p className="text-neutral-500 max-w-sm mb-8">
        Belum ada produk di keranjang belanja Anda. Yuk mulai belanja dan temukan perlengkapan diving terbaik!
      </p>
      <AnimatedButton asChild className="px-8 py-4 text-sm uppercase tracking-wider">
        <Link href="/produk">
          Mulai Belanja
        </Link>
      </AnimatedButton>
    </div>
  );
}
