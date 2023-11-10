'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/account/orders', label: 'Pesanan', icon: 'solar:bag-3-linear' },
  { href: '/account/addresses', label: 'Alamat', icon: 'solar:map-point-linear' },
  { href: '/account/settings', label: 'Pengaturan', icon: 'solar:settings-linear' },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      {/* Mobile: Horizontal scrollable pills */}
      <nav className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-2 px-2 lg:flex-col lg:mx-0 lg:px-0 lg:space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 lg:gap-3 py-2.5 px-4 rounded-xl transition-colors whitespace-nowrap flex-shrink-0',
                isActive
                  ? 'bg-neutral-100 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-50'
              )}
            >
              <Icon icon={item.icon} className="w-5 h-5" />
              <span className="text-sm lg:text-base">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/"
          className="flex items-center gap-2 lg:gap-3 py-2.5 px-4 rounded-xl text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <Icon icon="solar:logout-2-linear" className="w-5 h-5" />
          <span className="text-sm lg:text-base">Keluar</span>
        </Link>
      </nav>
    </aside>
  );
}
