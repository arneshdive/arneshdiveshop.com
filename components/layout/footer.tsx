import { getTranslations } from 'next-intl/server';
import { Icon } from '@iconify/react';
import { Link } from '@/i18n/navigation';
import { getPublicShopSettings } from '@/lib/queries/settings';
import { WaveDivider } from '@/components/layout/wave-divider';
import { NewsletterForm } from '@/components/layout/newsletter-form';
import { AnimatedUnderline } from '@/components/ui/animated-underline';
import { AdminFooterLink } from '@/components/layout/admin-footer-link';
import { siteConfig } from '@/config/site';

const paymentBadges = [
  { label: 'Visa', icon: 'logos:visa' },
  { label: 'Mastercard', icon: 'logos:mastercard' },
];

const paymentTextBadges = ['QRIS', 'Transfer Bank'];

export async function Footer() {
  const settings = await getPublicShopSettings();
  const t = await getTranslations('footer');

  return (
    <>
      <footer className="sticky bottom-0 z-10 text-neutral-400 rounded-b-[2.5rem] -mb-16 lg:-mb-20 pt-24 lg:pt-28 pb-0 overflow-visible">
        {/* Background container - only covers content, not wave area */}
        <div className="absolute inset-0 bg-neutral-900 rounded-b-[2.5rem] -z-10" style={{ bottom: '20px' }} />
        
        <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12 pb-12 lg:pb-16">
          <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-12">
            {/* Store identity */}
            <div className="min-w-0">
              <h2 className="text-[28px] lg:text-[32px] leading-tight font-semibold tracking-tight text-white [overflow-wrap:anywhere]">
                {settings.storeName}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed">
                {t.rich('storeDescription', {
                  masks: (chunks) => (
                    <Link href="/produk?category=masker" className="text-neutral-300 underline underline-offset-4 hover:text-white transition-colors">{chunks}</Link>
                  ),
                  fins: (chunks) => (
                    <Link href="/produk?category=fins" className="text-neutral-300 underline underline-offset-4 hover:text-white transition-colors">{chunks}</Link>
                  ),
                  wetsuits: (chunks) => (
                    <Link href="/produk?category=wetsuit" className="text-neutral-300 underline underline-offset-4 hover:text-white transition-colors">{chunks}</Link>
                  ),
                  snorkels: (chunks) => (
                    <Link href="/produk?category=snorkel" className="text-neutral-300 underline underline-offset-4 hover:text-white transition-colors">{chunks}</Link>
                  ),
                })}
              </p>
            </div>

            {/* Newsletter */}
            <div className="min-w-0 border-t border-neutral-800 pt-6 lg:self-stretch lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
              <NewsletterForm />
            </div>
          </div>

          {/* Full-width store information */}
          <div className="mt-8 grid gap-8 border-t border-neutral-800 pt-8 sm:grid-cols-2 lg:mt-10 lg:grid-cols-12 lg:gap-12">
            <div className="min-w-0 lg:col-span-5">
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-300">{t('visit')}</h3>
              {settings.addressFormatted && (
                <address className="mt-3 max-w-md text-sm leading-relaxed not-italic whitespace-pre-line [overflow-wrap:anywhere]">
                  {settings.addressFormatted}
                </address>
              )}
            </div>
            <div className="min-w-0 lg:col-span-4">
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-300">{t('contact')}</h3>
              <div className="mt-3 flex flex-col items-start gap-2">
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  className="max-w-full text-base font-medium leading-relaxed text-neutral-200 [overflow-wrap:anywhere] hover:text-white hover:underline underline-offset-4 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-4 focus-visible:ring-offset-neutral-900"
                >
                  {settings.phone}
                </a>
                <a
                  href={`mailto:${settings.email}`}
                  className="max-w-full text-base font-medium leading-relaxed text-neutral-200 [overflow-wrap:anywhere] hover:text-white hover:underline underline-offset-4 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-4 focus-visible:ring-offset-neutral-900"
                >
                  {settings.email}
                </a>
              </div>
              <div className="mt-4">
                <p className="text-xs text-neutral-400">Instagram</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {[
                    { href: siteConfig.links.instagram, label: 'Arnesh Dive' },
                    { href: siteConfig.links.haesteInstagram, label: 'Haeste Diveshop' },
                  ].map((social) => (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Instagram · ${social.label}`}
                      className="inline-flex min-w-0 items-center gap-1.5 text-neutral-300 hover:text-white transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-4 focus-visible:ring-offset-neutral-900"
                    >
                      <span>{social.label}</span>
                      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5 shrink-0">
                        <path d="M4 12 12 4M4 4h8v8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="min-w-0 lg:col-span-3">
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-300">{t('hours')}</h3>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{settings.businessHours}</p>
            </div>
          </div>
        </div>

        {/* Wave Divider - torn edge at bottom of footer top, overflowing downward */}
        <WaveDivider fill="#171717" className="absolute bottom-0 left-0 right-0 translate-y-[20px] lg:translate-y-[30px] rotate-180 pointer-events-none" />
      </footer>

      {/* Legal / payment bar */}
      <div className="sticky bottom-0 z-0 bg-black text-neutral-500 pt-20 lg:pt-24 pb-6">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <span>{t('copyright', { year: 2026 })}</span>
            <div className="flex flex-wrap gap-4">
              <Link href="/privasi" className="hover:text-white transition-colors"><AnimatedUnderline>{t('privacyPolicy')}</AnimatedUnderline></Link>
              <Link href="/syarat" className="hover:text-white transition-colors"><AnimatedUnderline>{t('termsAndConditions')}</AnimatedUnderline></Link>
              <Link href="/faq" className="hover:text-white transition-colors"><AnimatedUnderline>{t('help')}</AnimatedUnderline></Link>
              <Link href="/kontak" className="hover:text-white transition-colors"><AnimatedUnderline>{t('contact')}</AnimatedUnderline></Link>
              <Link href="/tentang-kami" className="hover:text-white transition-colors"><AnimatedUnderline>{t('about')}</AnimatedUnderline></Link>
              <AdminFooterLink />
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
