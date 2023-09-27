'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setHeight(entries[0].contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Spacer reserves scroll room equal to the fixed footer's height */}
      <div style={{ height }} aria-hidden="true" />
      <footer
        ref={footerRef}
        className="fixed bottom-0 left-0 right-0 z-0 bg-neutral-950 text-neutral-400 pt-24 lg:pt-28 pb-8"
      >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-3 gap-10 lg:gap-8 pb-16 border-b border-neutral-800">
          {/* Wordmark + Links */}
          <div className="flex flex-col justify-between gap-10">
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter text-white leading-none">
              ARNES
              <br />
              DIVE
            </h2>
            <div className="flex flex-wrap gap-10 lg:gap-12">
              <div>
                <h5 className="text-xs uppercase tracking-wider font-semibold text-white mb-3">Bantuan</h5>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                  <li><Link href="/faq" className="hover:text-white transition-colors">Pengiriman</Link></li>
                  <li><Link href="/faq" className="hover:text-white transition-colors">Pengembalian</Link></li>
                  <li><Link href="/kontak" className="hover:text-white transition-colors">Hubungi Kami</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="text-xs uppercase tracking-wider font-semibold text-white mb-3">Tentang</h5>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/tentang" className="hover:text-white transition-colors">Tentang Kami</Link></li>
                  <li><Link href="/privasi" className="hover:text-white transition-colors">Kebijakan Privasi</Link></li>
                  <li><Link href="/syarat" className="hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col justify-end gap-2 lg:pl-8 lg:border-l border-neutral-800">
            <a
              href="https://wa.me/6281234567890"
              className="text-lg lg:text-xl font-medium text-neutral-200 underline underline-offset-4 hover:text-white transition-colors"
            >
              +62 812-3456-7890
            </a>
            <a
              href="mailto:support@arnesdive.com"
              className="text-lg lg:text-xl font-medium text-neutral-200 underline underline-offset-4 hover:text-white transition-colors"
            >
              support@arnesdive.com
            </a>
            <span className="text-sm text-neutral-500 mt-2">Senin – Jumat: 09:00 – 17:00 WIB</span>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col justify-end">
            <p className="text-xl lg:text-2xl font-bold text-white leading-snug mb-5">
              Dapatkan info produk & promo terbaru
            </p>
            <form className="flex items-center bg-neutral-900 border border-neutral-800 rounded-full p-1.5 pl-5">
              <input
                type="email"
                placeholder="Email Anda"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Langganan"
                className="w-9 h-9 rounded-full bg-white text-neutral-900 flex items-center justify-center hover:bg-neutral-200 transition-colors flex-shrink-0"
              >
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="text-center pt-8 text-xs text-neutral-500">
          © {new Date().getFullYear()} Arnes Dive Shop. All rights reserved.
        </div>
      </div>
      </footer>
    </>
  );
}
