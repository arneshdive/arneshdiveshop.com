import Link from 'next/link';
import { Icon } from '@iconify/react';
import { getPublicShopSettings } from '@/lib/queries/settings';

const paymentBadges = [
  { label: 'Visa', icon: 'logos:visa' },
  { label: 'Mastercard', icon: 'logos:mastercard' },
  { label: 'PayPal', icon: 'logos:paypal' },
];

const paymentTextBadges = ['QRIS', 'Transfer Bank'];

export async function Footer() {
  const year = new Date().getFullYear();
  const settings = await getPublicShopSettings();

  return (
    <>
      <footer className="sticky bottom-0 z-10 bg-neutral-950 text-neutral-400 rounded-b-[2.5rem] -mb-16 lg:-mb-20 pt-24 lg:pt-28 pb-16 lg:pb-20">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-8">
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
                href={`https://wa.me/${settings.whatsapp}`}
                className="text-lg lg:text-xl font-medium text-neutral-200 underline underline-offset-4 hover:text-white transition-colors"
              >
                {settings.phone}
              </a>
              <a
                href={`mailto:${settings.email}`}
                className="text-lg lg:text-xl font-medium text-neutral-200 underline underline-offset-4 hover:text-white transition-colors"
              >
                {settings.email}
              </a>
              <span className="text-sm text-neutral-500 mt-2">{settings.businessHours}</span>
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
        </div>
      </footer>

      {/* Legal / payment bar - second reveal layer beneath the main footer */}
      <div className="sticky bottom-0 z-0 bg-black text-neutral-500 pt-20 lg:pt-24 pb-6">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <span>© {year} Arnes Dive Shop. All rights reserved.</span>
            <div className="flex flex-wrap gap-4">
              <Link href="/privasi" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
              <Link href="/syarat" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
              <Link href="/faq" className="hover:text-white transition-colors">Pengembalian</Link>
              <Link href="/kontak" className="hover:text-white transition-colors">Kontak</Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {paymentBadges.map((badge) => (
              <span
                key={badge.label}
                title={badge.label}
                className="w-10 h-7 rounded bg-white flex items-center justify-center"
              >
                <Icon icon={badge.icon} className="w-6 h-6" />
              </span>
            ))}
            {paymentTextBadges.map((label) => (
              <span
                key={label}
                className="h-7 px-2.5 rounded bg-white text-neutral-800 text-[10px] font-semibold flex items-center justify-center"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
