'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { SearchModal } from '@/components/search/search-modal';
import { useCartStore, useCartSync } from '@/lib/store/cart';

// Fixed navigation menu items
const NAV_ITEMS = [
  { name: 'Semua Katalog', href: '/produk' },
  { name: 'New Arrivals', href: '/produk?newArrival=true' },
  { name: 'Sale', href: '/produk?onSale=true', className: 'text-red-600 hover:text-red-700' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  
  // Sync cart on mount
  useCartSync();
  
  const itemCount = useCartStore((state) => state.getItemCount());

  // Wait for mount to avoid hydration mismatch with persisted cart
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close modals on route change
  useEffect(() => {
    setSearchOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // On homepage: transparent -> white on scroll
  // On other pages: always white with border
  const headerBg = isHomepage
    ? scrolled
      ? 'bg-white/90 backdrop-blur-md'
      : 'bg-transparent'
    : 'bg-white border-b border-neutral-200';

  const textColor = isHomepage
    ? scrolled
      ? 'text-neutral-900'
      : 'text-white'
    : 'text-neutral-900';

  const linkColor = isHomepage
    ? scrolled
      ? 'text-neutral-600 hover:text-neutral-900'
      : 'text-white/80 hover:text-white'
    : 'text-neutral-600 hover:text-neutral-900';

  const iconColor = isHomepage
    ? scrolled
      ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
      : 'text-white/80 hover:text-white hover:bg-white/10'
    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100';

  const badgeBg = isHomepage
    ? scrolled
      ? 'bg-neutral-900 text-white'
      : 'bg-white text-neutral-900'
    : 'bg-neutral-900 text-white';

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
        <nav className="flex items-center justify-between px-6 lg:px-12 py-4 max-w-[1440px] mx-auto w-full">
          {/* Left: Logo + Desktop Nav Links */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link
              href="/"
              className={`text-2xl font-bold tracking-tight transition-opacity hover:opacity-70 ${textColor}`}
            >
              Arnesh Dive™
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex gap-6">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-base tracking-wide underline-animated ${item.className || linkColor}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className={`p-2 rounded-full transition-all ${iconColor}`}
              aria-label="Cari"
            >
              <Icon icon="solar:magnifer-linear" className="w-6 h-6" />
            </button>
            <Link
              href="/cart"
              className={`p-2 rounded-full transition-all relative ${iconColor}`}
              aria-label="Keranjang"
            >
              <Icon icon="solar:bag-3-linear" className="w-6 h-6" />
              {/* Cart count badge */}
              {mounted && itemCount > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] rounded-full flex items-center justify-center font-medium ${badgeBg}`}>
                  {itemCount}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              className={`p-2 rounded-full transition-all hidden sm:block ${iconColor}`}
              aria-label="Akun"
            >
              <Icon icon="solar:user-linear" className="w-6 h-6" />
            </Link>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden p-2 rounded-full transition-all ${iconColor}`}
              type="button"
              aria-label="Menu"
            >
              <Icon icon="solar:hamburger-menu-linear" className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <span className="text-lg font-semibold">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
                aria-label="Tutup menu"
              >
                <Icon icon="solar:close-circle-linear" className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-6">
              <ul className="space-y-4">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block text-lg font-medium py-2 underline-animated ${item.className || 'text-neutral-700 hover:text-neutral-900'}`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-4 border-t border-neutral-200">
                  <Link
                    href="/account"
                    className="flex items-center gap-3 text-lg font-medium py-2 text-neutral-700 hover:text-neutral-900 underline-animated"
                  >
                    <Icon icon="solar:user-linear" className="w-5 h-5" />
                    Akun Saya
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
