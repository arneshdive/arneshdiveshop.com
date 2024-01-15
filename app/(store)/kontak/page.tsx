import { Metadata } from 'next';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ContactForm } from './contact-form';
import { getPublicShopSettings } from '@/lib/queries/settings';
import { USPSection } from '@/components/layout/usp-section';

export const metadata: Metadata = {
  title: 'Kontak | Arnes Dive Shop',
  description: 'Hubungi tim customer service Arnes Dive Shop untuk pertanyaan tentang pesanan, produk, atau layanan kami.',
};

export default async function KontakPage() {
  const settings = await getPublicShopSettings();

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Hubungi Kami
          </h1>
          <p className="text-neutral-500 max-w-xl">
            Ada pertanyaan tentang pesanan atau produk? Tim kami siap membantu Anda.
          </p>
        </header>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="text-lg font-semibold mb-6">Kirim Pesan</h2>
            <ContactForm />
          </div>

          {/* Contact Info */}
          <div className="lg:border-l lg:border-neutral-200 lg:pl-16">
            <h2 className="text-lg font-semibold mb-6">Informasi Kontak</h2>
            
            <div className="space-y-6">
              {/* WhatsApp */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <Icon icon="solar:chat-round-dots-linear" className="w-5 h-5 text-neutral-700" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">WhatsApp</p>
                  <a
                    href={`https://wa.me/${settings.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium text-neutral-900 hover:underline"
                  >
                    {settings.phone}
                  </a>
                  <p className="text-sm text-neutral-500 mt-1">Respon cepat dalam jam kerja</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <Icon icon="solar:letter-linear" className="w-5 h-5 text-neutral-700" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Email</p>
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-base font-medium text-neutral-900 hover:underline"
                  >
                    {settings.email}
                  </a>
                  <p className="text-sm text-neutral-500 mt-1">Respon dalam 1-2 hari kerja</p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <Icon icon="solar:clock-circle-linear" className="w-5 h-5 text-neutral-700" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Jam Operasional</p>
                  <p className="text-base font-medium text-neutral-900">{settings.businessHours}</p>
                </div>
              </div>

              {/* Instagram */}
              {settings.instagram && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <Icon icon="mdi:instagram" className="w-5 h-5 text-neutral-700" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Instagram</p>
                    <a
                      href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-medium text-neutral-900 hover:underline"
                    >
                      {settings.instagram}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-10 pt-8 border-t border-neutral-200">
              <p className="text-sm text-neutral-500 mb-4">Butuh bantuan cepat?</p>
              <div className="flex flex-wrap gap-3">
                <AnimatedButton asChild size="sm">
                  <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer">
                    <Icon icon="solar:chat-round-dots-linear" className="w-4 h-4" />
                    Chat WhatsApp
                  </a>
                </AnimatedButton>
                <AnimatedButton asChild variant="outline" size="sm">
                  <a href="/faq">
                    <Icon icon="solar:question-circle-linear" className="w-4 h-4" />
                    Lihat FAQ
                  </a>
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* USP Section - overlaps the footer below it */}
      <section className="relative z-10 -mb-16 lg:-mb-20">
        <USPSection />
      </section>
    </>
  );
}
