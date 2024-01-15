import { Metadata } from 'next';
import { USPSection } from '@/components/layout/usp-section';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | Arnes Dive Shop',
  description: 'Syarat dan ketentuan penggunaan layanan Arnes Dive Shop - pembelian, pengiriman, dan kebijakan pengembalian.',
};

export default function SyaratPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Syarat & Ketentuan
          </h1>
          <p className="text-neutral-500">
            Terakhir diperbarui: Juli 2026
          </p>
        </header>

        {/* Content */}
        <div className="prose prose-neutral max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">1. Ketentuan Umum</h2>
            <p className="text-neutral-700 leading-relaxed">
              Dengan mengakses dan menggunakan website Arnes Dive Shop, Anda menyetujui untuk terikat dengan syarat dan ketentuan ini. Jika Anda tidak menyetujui syarat-syarat ini, mohon untuk tidak menggunakan layanan kami.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">2. Akun Pengguna</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Untuk melakukan pembelian, Anda perlu membuat akun. Anda bertanggung jawab untuk:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>Menyimpan kerahasiaan informasi akun Anda</li>
              <li>Memberikan informasi yang akurat dan lengkap</li>
              <li>Segera memberitahu kami jika ada penggunaan tidak sah</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">3. Pembelian</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Dengan melakukan pembelian, Anda menyatakan bahwa:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>Anda berusia minimal 18 tahun atau memiliki persetujuan orang tua/wali</li>
              <li>Informasi yang diberikan benar dan akurat</li>
              <li>Pembayaran yang dilakukan sah dan tidak melanggar hukum</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-4">
              Harga yang tertera dalam Rupiah Indonesia (IDR). Kami berhak mengubah harga sewaktu-waktu tanpa pemberitahuan sebelumnya.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">4. Pembayaran</h2>
            <p className="text-neutral-700 leading-relaxed">
              Kami menerima pembayaran melalui transfer bank, kartu kredit/debit, dan e-wallet (GoPay, OVO, Dana, QRIS). Pembayaran harus dilakukan sebelum pesanan diproses.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">5. Pengiriman</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Kami mengirim ke seluruh Indonesia melalui kurir partner kami. Estimasi waktu pengiriman:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li><strong>Standar:</strong> 3-5 hari kerja</li>
              <li><strong>Express:</strong> 1-2 hari kerja</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-4">
              Biaya pengiriman dihitung berdasarkan berat dan lokasi. Kami tidak bertanggung jawab atas keterlambatan yang disebabkan oleh pihak kurir atau force majeure.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">6. Kebijakan Pengembalian & Penukaran</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Kami menerima pengembalian dan penukaran dalam kondisi berikut:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>Produk dalam kondisi baru dan belum digunakan</li>
              <li>Packaging dan label masih lengkap</li>
              <li>Diajukan dalam waktu 7 hari setelah penerimaan</li>
              <li>Dilampiri bukti pembelian (invoice)</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-4">
              <strong>Produk yang tidak dapat dikembalikan:</strong> produk yang sudah digunakan, drama/custom, dan produk dengan seal rusak.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">7. Garansi</h2>
            <p className="text-neutral-700 leading-relaxed">
              Garansi produk mengikuti kebijakan masing-masing brand. Untuk klaim garansi, hubungi customer service kami dengan menyertakan bukti pembelian dan foto kerusakan.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">8. Kekayaan Intelektual</h2>
            <p className="text-neutral-700 leading-relaxed">
              Seluruh konten di website ini termasuk logo, gambar, teks, dan desain adalah milik Arnes Dive Shop dan dilindungi oleh hukum hak cipta. Dilarang menyalin atau menggunakan konten tanpa izin tertulis.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">9. Batasan Tanggung Jawab</h2>
            <p className="text-neutral-700 leading-relaxed">
              Kami tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan produk atau layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Perubahan Kebijakan</h2>
            <p className="text-neutral-700 leading-relaxed">
              Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan efektif segera setelah dipublikasikan di website. Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan.
            </p>
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
