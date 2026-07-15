import { Metadata } from 'next';
import { USPSection } from '@/components/layout/usp-section';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | Arnes Dive Shop',
  description: 'Kebijakan privasi Arnes Dive Shop - bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.',
};

export default function PrivasiPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Kebijakan Privasi
          </h1>
          <p className="text-neutral-500">
            Terakhir diperbarui: Juli 2026
          </p>
        </header>

        {/* Content */}
        <div className="prose prose-neutral max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">1. Pendahuluan</h2>
            <p className="text-neutral-700 leading-relaxed">
              Arnes Dive Shop (&quot;kami&quot;) berkomitmen untuk melindungi privasi Anda. Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi pribadi Anda ketika Anda mengunjungi website kami atau melakukan pembelian.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">2. Informasi yang Kami Kumpulkan</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Kami mengumpulkan informasi berikut:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li><strong>Informasi Pribadi:</strong> Nama lengkap, alamat email, nomor telepon, alamat pengiriman</li>
              <li><strong>Informasi Pembayaran:</strong> Detail pembayaran diproses secara aman oleh payment gateway kami</li>
              <li><strong>Informasi Perangkat:</strong> Alamat IP, jenis browser, sistem operasi, preferensi bahasa</li>
              <li><strong>Informasi Navigasi:</strong> Halaman yang dikunjungi, waktu kunjungan, sumber referral</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">3. Penggunaan Informasi</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Informasi yang kami kumpulkan digunakan untuk:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>Memproses dan mengirim pesanan Anda</li>
              <li>Berkomunikasi tentang status pesanan dan layanan pelanggan</li>
              <li>Mengirim newsletter dan promosi (dengan persetujuan Anda)</li>
              <li>Meningkatkan pengalaman pengguna di website kami</li>
              <li>Mencegah penipuan dan aktivitas ilegal</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">4. Keamanan Data</h2>
            <p className="text-neutral-700 leading-relaxed">
              Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi informasi pribadi Anda dari akses tidak sah, pengubahan, pengungkapan, atau penghancuran. Data pembayaran dienkripsi menggunakan protokol SSL/TLS.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">5. Cookies</h2>
            <p className="text-neutral-700 leading-relaxed">
              Kami menggunakan cookies untuk meningkatkan pengalaman browsing Anda, mengingat preferensi Anda, dan menganalisis traffic website. Anda dapat mengatur browser Anda untuk menolak cookies, namun hal ini dapat mempengaruhi fungsionalitas website.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">6. Berbagi Informasi</h2>
            <p className="text-neutral-700 leading-relaxed">
              Kami tidak menjual informasi pribadi Anda kepada pihak ketiga. Kami hanya membagikan informasi yang diperlukan untuk:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>Layanan pengiriman (nama, alamat, telepon)</li>
              <li>Pemrosesan pembayaran (detail transaksi)</li>
              <li>Penegakan hukum jika diwajibkan oleh hukum</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">7. Hak Anda</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Anda memiliki hak untuk:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>Mengakses informasi pribadi yang kami simpan tentang Anda</li>
              <li>Meminta koreksi data yang tidak akurat</li>
              <li>Meminta penghapusan data Anda</li>
              <li>Berhenti berlangganan newsletter kapan saja</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Hubungi Kami</h2>
            <p className="text-neutral-700 leading-relaxed">
              Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui:
            </p>
            <ul className="list-none text-neutral-700 space-y-1 mt-3">
              <li>Email: support@arneshdive.com</li>
              <li>WhatsApp: +62 812-3456-7890</li>
            </ul>
          </section>
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
