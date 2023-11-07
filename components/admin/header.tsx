'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';

interface AdminHeaderProps {
  title?: string;
}

const routeLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Produk',
  '/admin/orders': 'Pesanan',
  '/admin/customers': 'Pelanggan',
  '/admin/settings': 'Pengaturan',
};

export function AdminHeader({ title }: AdminHeaderProps) {
  const pathname = usePathname();
  const pageTitle = title || routeLabels[pathname] || 'Admin';

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between px-6 lg:px-8 py-4">
        {/* Left: Page Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">{pageTitle}</h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* View Store Link */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Icon icon="solar:eye-linear" className="w-4 h-4" />
            <span className="hidden sm:inline tracking-wide">Lihat Toko</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
