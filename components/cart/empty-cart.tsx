import Link from 'next/link';
import { Icon } from '@iconify/react';

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Icon icon="solar:bag-3-linear" className="w-24 h-24 text-neutral-300 mb-6" />
      <h2 className="text-xl font-semibold mb-2">Keranjang Kosong</h2>
      <p className="text-neutral-500 text-center mb-6">
        Belum ada produk di keranjang belanja Anda.
      </p>
      <Link
        href="/produk"
        className="bg-neutral-900 text-white px-8 py-3 text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors"
      >
        Mulai Belanja
      </Link>
    </div>
  );
}
