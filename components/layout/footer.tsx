import Link from 'next/link';
import { Icon } from '@iconify/react';
import { getPublicShopSettings } from '@/lib/queries/settings';
import { WaveDivider } from '@/components/layout/wave-divider';
import { getSession } from '@/lib/auth/session';
import { NewsletterForm } from '@/components/layout/newsletter-form';
import { AnimatedUnderline } from '@/components/ui/animated-underline';

const paymentBadges = [
  { label: 'Visa', icon: 'logos:visa' },
  { label: 'Mastercard', icon: 'logos:mastercard' },
];

const paymentTextBadges = ['QRIS', 'Transfer Bank'];

export async function Footer() {
  const year = new Date().getFullYear();
  const settings = await getPublicShopSettings();
  const session = await getSession();
  const isAdmin = session?.role === 'admin' || session?.role === 'super_admin';

  return (
    <>
      <footer className="sticky bottom-0 z-10 text-neutral-400 rounded-b-[2.5rem] -mb-16 lg:-mb-20 pt-24 lg:pt-28 pb-0 overflow-visible">
        {/* Background container - only covers content, not wave area */}
        <div className="absolute inset-0 bg-neutral-900 rounded-b-[2.5rem] -z-10" style={{ bottom: '20px' }} />
        
        <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12 pb-12 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-8">
            {/* Contact */}
            <div className="flex flex-col justify-end gap-2">
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
              <span className="text-sm text-neutral-500 mt-2 whitespace-pre-line">{settings.businessHours}</span>
            </div>

            {/* Newsletter */}
            <NewsletterForm />
          </div>
        </div>

        {/* Wave Divider - torn edge at bottom of footer top, overflowing downward */}
        <WaveDivider fill="#171717" className="absolute bottom-0 left-0 right-0 translate-y-[20px] lg:translate-y-[30px] rotate-180 pointer-events-none" />
      </footer>

      {/* Legal / payment bar */}
      <div className="sticky bottom-0 z-0 bg-black text-neutral-500 pt-20 lg:pt-24 pb-6">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <span>© {year} Arnes Dive Shop. All rights reserved.</span>
            <div className="flex flex-wrap gap-4">
              <Link href="/privasi" className="hover:text-white transition-colors"><AnimatedUnderline>Kebijakan Privasi</AnimatedUnderline></Link>
              <Link href="/syarat" className="hover:text-white transition-colors"><AnimatedUnderline>Syarat & Ketentuan</AnimatedUnderline></Link>
              <Link href="/faq" className="hover:text-white transition-colors"><AnimatedUnderline>Bantuan</AnimatedUnderline></Link>
              <Link href="/kontak" className="hover:text-white transition-colors"><AnimatedUnderline>Kontak</AnimatedUnderline></Link>
              {isAdmin && <Link href="/admin" className="hover:text-white transition-colors"><AnimatedUnderline>Portal Admin</AnimatedUnderline></Link>}
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
