import Link from 'next/link';
import { Icon } from '@iconify/react';

interface EmptySearchProps {
  query: string;
}

export function EmptySearch({ query }: EmptySearchProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
      <Icon icon="solar:magnifer-zoom-in-linear" className="w-16 h-16 text-neutral-300 mb-4" />
      <h2 className="text-xl font-semibold text-neutral-900 mb-2">
        Tidak ada hasil untuk &quot;{query}&quot;
      </h2>
      <p className="text-neutral-500 mb-8 max-w-md">
        Coba kata kunci lain atau jelajahi kategori kami untuk menemukan produk yang Anda cari.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/freediving"
          className="px-6 py-3 bg-cyan-700 text-white text-sm font-medium rounded hover:bg-cyan-800 transition-colors"
        >
          Freediving
        </Link>
        <Link
          href="/scuba"
          className="px-6 py-3 bg-blue-800 text-white text-sm font-medium rounded hover:bg-blue-900 transition-colors"
        >
          Scuba
        </Link>
        <Link
          href="/aksesoris"
          className="px-6 py-3 bg-neutral-700 text-white text-sm font-medium rounded hover:bg-neutral-800 transition-colors"
        >
          Aksesoris
        </Link>
      </div>
    </div>
  );
}
