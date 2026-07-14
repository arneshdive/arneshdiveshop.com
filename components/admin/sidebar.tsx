'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'solar:chart-2-linear' },
  { href: '/admin/products', label: 'Produk', icon: 'solar:box-linear' },
  { href: '/admin/categories', label: 'Kategori', icon: 'solar:folder-linear' },
  { href: '/admin/brands', label: 'Merek', icon: 'solar:tag-linear' },
  { href: '/admin/orders', label: 'Pesanan', icon: 'solar:document-text-linear' },
  { href: '/admin/users', label: 'Pengguna', icon: 'solar:users-group-rounded-linear' },
  { href: '/admin/settings', label: 'Pengaturan', icon: 'solar:settings-linear' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
 const res = await fetch('/api/account/profile');
      if (!res.ok) return null;
      const data = await res.json();
      return data.profile;
    },
  });

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <aside
      className={`sticky top-0 h-screen bg-neutral-950 text-neutral-400 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between px-3 py-5 border-b border-neutral-800">
        <Link href="/admin" className="group px-3">
          <Icon icon="solar:widget-5-bold" className="w-6 h-6 text-white" />
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon
            icon={collapsed ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-left-linear'}
            className="w-5 h-5"
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-neutral-800 text-white'
                      : 'hover:bg-neutral-800/60 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    icon={item.icon}
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-white'}`}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium tracking-wide">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Menu */}
      <div className="border-t border-neutral-800 p-3">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {profile?.email?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          {!collapsed && (
            <span className="text-sm text-neutral-400 truncate flex-1 min-w-0">
              {profile?.email || 'admin'}
            </span>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Logout"
            >
              <Icon icon="solar:logout-2-linear" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>


    </aside>
  );
}
