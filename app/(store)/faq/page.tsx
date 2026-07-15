import { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { AnimatedButton } from '@/components/ui/animated-button';
import { USPSection } from '@/components/layout/usp-section';
import { getPublicShopSettings } from '@/lib/queries/settings';

export const metadata: Metadata = {
  title: 'Pusat Bantuan | Arnes Dive Shop',
  description: 'Pertanyaan yang sering diajukan tentang pembelian, pengiriman, dan produk di Arnes Dive Shop.',
};

const faqCategories = [
  { id: 'pengiriman', label: 'Pengiriman', icon: 'solar:box-linear' },
  { id: 'pengembalian', label: 'Pengembalian', icon: 'solar:refresh-linear' },
  { id: 'pembayaran', label: 'Pembayaran', icon: 'solar:card-linear' },
  { id: 'produk', label: 'Produk', icon: 'solar:bag-linear' },
  { id: 'akun', label: 'Akun', icon: 'solar:user-linear' },
];

const faqData = {
  pengiriman: [
    {
      question: 'Berapa lama waktu pengiriman?',
      answer: 'Pengiriman standar membutuhkan 3-5 hari kerja, sedangkan pengiriman express 1-2 hari kerja. Waktu pengiriman dihitung sejak pesanan dikirim dari gudang kami.',
    },
    {
      question: 'Bagaimana cara melacak pesanan saya?',
      answer: 'Setelah pesanan dikirim, Anda akan menerima email berisi nomor resi dan link untuk melacak status pengiriman. Anda juga dapat mengecek status melalui halaman "Pesanan Saya" di akun Anda.',
    },
    {
      question: 'Apakah bisa mengubah alamat pengiriman setelah checkout?',
      answer: 'Perubahan alamat hanya bisa dilakukan sebelum pesanan diproses. Silakan hubungi customer service kami secepatnya melalui WhatsApp atau email.',
    },
    {
      question: 'Kurir apa saja yang tersedia?',
      answer: 'Kami bekerja sama dengan JNE, J&T Express, SiCepat, ID Express, AnterAja, POS Indonesia, dan Tiki. Ketersediaan kurir mungkin berbeda untuk setiap lokasi.',
    },
  ],
  pengembalian: [
    {
      question: 'Bagaimana cara mengembalikan produk?',
      answer: 'Hubungi customer service kami dalam waktu 7 hari setelah menerima pesanan. Sertakan foto produk dan alasan pengembalian. Jika disetujui, Anda akan menerima panduan pengiriman barang kembali.',
    },
    {
      question: 'Apakah ada biaya pengembalian?',
      answer: 'Biaya pengiriman pengembalian ditanggung pembeli kecuali produk cacat atau tidak sesuai pesanan. Biaya pengiriman ulang untuk penukaran ditanggung kami.',
    },
    {
      question: 'Berapa lama proses refund?',
      answer: 'Refund akan diproses dalam 3-5 hari kerja setelah produk kami terima dan diperiksa. Waktu masuk ke rekening Anda tergantung metode pembayaran dan bank Anda.',
    },
    {
      question: 'Produk apa saja yang tidak bisa dikembalikan?',
      answer: 'Produk yang sudah digunakan, produk custom/warna khusus, dan produk dengan seal rusak tidak dapat dikembalikan. Masker juga tidak dapat dikembalikan karena alasan kebersihan.',
    },
  ],
  pembayaran: [
    {
      question: 'Metode pembayaran apa saja yang tersedia?',
      answer: 'Kami menerima transfer bank (BCA, Mandiri, BNI, BRI), kartu kredit/debit (Visa, Mastercard), e-wallet (GoPay, OVO, Dana), dan QRIS.',
    },
    {
      question: 'Apakah pembayaran saya aman?',
      answer: 'Ya, semua transaksi dienkripsi dengan protokol SSL/TLS. Kami tidak menyimpan detail kartu kredit Anda. Pemrosesan pembayaran dilakukan oleh payment gateway terpercaya.',
    },
    {
      question: 'Bagaimana jika pembayaran gagal?',
      answer: 'Periksa saldo atau limit kartu Anda. Jika masalah berlanjut, coba metode pembayaran lain atau hubungi bank Anda. Keranjang Anda tetap tersimpan selama 24 jam.',
    },
    {
      question: 'Bisa bayar dengan cicilan?',
      answer: 'Ya, kami menyediakan cicilan tanpa kartu kredit melalui partner kami. Opsi cicilan akan muncul di halaman checkout untuk pembelian minimal Rp 500.000.',
    },
  ],
  produk: [
    {
      question: 'Bagaimana cara memilih ukuran yang tepat?',
      answer: 'Setiap produk dilengkapi panduan ukuran (size guide). Anda juga dapat menghubungi customer service untuk rekomendasi berdasarkan tinggi dan berat badan Anda.',
    },
    {
      question: 'Apakah produk dijamin 100% original?',
      answer: 'Ya, semua produk yang kami jual adalah 100% original dari distributor resmi. Kami memberikan jaminan keaslian untuk setiap produk.',
    },
    {
      question: 'Bagaimana cara merawat peralatan diving?',
      answer: 'Bilas dengan air tawar setelah digunakan, keringkan di tempat teduh (hindari sinar matahari langsung), dan simpan di tempat kering. Detail perawatan berbeda untuk setiap produk, cek label atau panduan produk.',
    },
    {
      question: 'Apakah ada garansi?',
      answer: 'Garansi mengikuti kebijakan masing-masing brand, biasanya 6-12 bulan untuk defect pabrik. Simpan invoice Anda sebagai bukti pembelian.',
    },
  ],
  akun: [
    {
      question: 'Bagaimana cara mengubah profil saya?',
      answer: 'Login ke akun Anda, buka halaman "Profil" atau "Pengaturan". Anda dapat mengubah nama, email, nomor telepon, dan alamat.',
    },
    {
      question: 'Lupa password, bagaimana cara reset?',
      answer: 'Klik "Lupa Password" di halaman login. Masukkan email terdaftar dan Anda akan menerima link untuk reset password.',
    },
    {
      question: 'Apakah saya wajib membuat akun untuk berbelanja?',
      answer: 'Ya, akun diperlukan untuk melacak pesanan, menyimpan alamat, dan mendapatkan poin reward. Proses pendaftaran cepat dan gratis.',
    },
    {
      question: 'Bagaimana cara menghapus akun?',
      answer: 'Hubungi customer service kami melalui email atau WhatsApp dengan permintaan penghapusan akun. Data Anda akan dihapus dalam 30 hari kerja sesuai kebijakan privasi.',
    },
  ],
};

export default async function FAQPage() {
  const settings = await getPublicShopSettings();

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Pusat Bantuan
          </h1>
          <p className="text-neutral-500 max-w-xl mx-auto mb-8">
            Temukan jawaban untuk pertanyaan yang sering diajukan atau hubungi kami jika membutuhkan bantuan lebih lanjut.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="search"
                placeholder="Cari pertanyaan..."
                className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
        </header>

        {/* Category Links */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {faqCategories.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-full text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Icon icon={cat.icon} className="w-4 h-4" />
              {cat.label}
            </a>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="max-w-3xl mx-auto space-y-12">
          {faqCategories.map((cat) => (
            <section key={cat.id} id={cat.id}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon icon={cat.icon} className="w-5 h-5 text-neutral-500" />
                {cat.label}
              </h2>
              <Accordion>
                {faqData[cat.id as keyof typeof faqData].map((item, index) => (
                  <AccordionItem key={index} title={item.question}>
                    {item.answer}
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-16 text-center">
          <p className="text-neutral-500 mb-4">Masih butuh bantuan?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <AnimatedButton asChild variant="outline" size="sm">
              <Link href="/kontak">
                <Icon icon="solar:letter-linear" className="w-4 h-4" />
                Hubungi Kami
              </Link>
            </AnimatedButton>
            <AnimatedButton asChild size="sm">
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer">
                <Icon icon="solar:chat-round-dots-linear" className="w-4 h-4" />
                WhatsApp
              </a>
            </AnimatedButton>
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
