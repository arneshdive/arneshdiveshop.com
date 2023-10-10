'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { SearchModal } from '@/components/search/search-modal';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search modal on route change
  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

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

  const saleColor = isHomepage
    ? scrolled
      ? 'text-red-500 hover:text-red-600'
      : 'text-red-400 hover:text-red-300'
    : 'text-red-500 hover:text-red-600';

  const badgeBg = isHomepage
    ? scrolled
      ? 'bg-neutral-900 text-white'
      : 'bg-white text-neutral-900'
    : 'bg-neutral-900 text-white';

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
        <nav className="flex items-center justify-between px-6 lg:px-12 py-4 max-w-[1440px] mx-auto w-full">
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-8">
            {/* Mobile Menu Button */}
            <button
              className={`lg:hidden p-2 -ml-2 transition-colors ${linkColor}`}
              type="button"
              aria-label="Menu"
            >
              <Icon icon="solar:hamburger-menu-linear" className="w-7 h-7" />
            </button>

            {/* Logo */}
            <Link
              href="/"
              className={`text-2xl font-bold tracking-tight transition-opacity hover:opacity-70 ${textColor}`}
            >
              ARNES DIVE
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex gap-6">
              <Link href="/produk?category=freediving" className={`text-base tracking-wide transition-colors ${linkColor}`}>
                Freediving
              </Link>
              <Link href="/produk?category=scuba" className={`text-base tracking-wide transition-colors ${linkColor}`}>
                Scuba
              </Link>
              <Link href="/produk?category=aksesoris" className={`text-base tracking-wide transition-colors ${linkColor}`}>
                Aksesoris
              </Link>
              <Link href="/produk?category=sale" className={`text-base tracking-wide font-medium transition-colors ${saleColor}`}>
                Sale
              </Link>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className={`p-2 rounded-full transition-all ${iconColor}`}
              aria-label="Cari"
            >
              <Icon icon="solar:magnifer-linear" className="w-6 h-6" />
            </button>
            <Link
              href="/wishlist"
              className={`p-2 rounded-full transition-all ${iconColor}`}
              aria-label="Wishlist"
            >
              <Icon icon="solar:heart-linear" className="w-6 h-6" />
            </Link>
            <Link
              href="/cart"
              className={`p-2 rounded-full transition-all relative ${iconColor}`}
              aria-label="Keranjang"
            >
              <Icon icon="solar:bag-3-linear" className="w-6 h-6" />
              {/* Cart count badge */}
              <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] rounded-full flex items-center justify-center font-medium ${badgeBg}`}>
                2
              </span>
            </Link>
            <Link
              href="/account"
              className={`p-2 rounded-full transition-all hidden sm:block ${iconColor}`}
              aria-label="Akun"
            >
              <Icon icon="solar:user-linear" className="w-6 h-6" />
            </Link>
          </div>
        </nav>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
