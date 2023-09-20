import Link from 'next/link';
import { Header } from '@/components/header';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col font-sans text-sm leading-relaxed">
      <Header />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h5 className="text-xs uppercase tracking-wider font-semibold mb-4">Newsletter</h5>
            <p className="text-xs text-gray-600 mb-3">Dapatkan info produk terbaru</p>
            <input
              type="email"
              placeholder="Email Anda"
              className="w-full px-3 py-2 border border-gray-300 mb-2 text-sm"
            />
            <button className="w-full bg-brand text-white px-3 py-2 text-xs uppercase hover:bg-gray-700">
              Langganan
            </button>
          </div>
          <div>
            <h5 className="text-xs uppercase tracking-wider font-semibold mb-4">Belanja</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/freediving" className="text-gray-600 hover:text-brand">Freediving</Link></li>
              <li><Link href="/scuba" className="text-gray-600 hover:text-brand">Scuba</Link></li>
              <li><Link href="/aksesoris" className="text-gray-600 hover:text-brand">Aksesoris</Link></li>
              <li><Link href="/sale" className="text-gray-600 hover:text-brand">Sale</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs uppercase tracking-wider font-semibold mb-4">Bantuan</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="text-gray-600 hover:text-brand">FAQ</Link></li>
              <li><Link href="/faq" className="text-gray-600 hover:text-brand">Pengiriman</Link></li>
              <li><Link href="/faq" className="text-gray-600 hover:text-brand">Pengembalian</Link></li>
              <li><Link href="/kontak" className="text-gray-600 hover:text-brand">Hubungi Kami</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs uppercase tracking-wider font-semibold mb-4">Tentang</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tentang" className="text-gray-600 hover:text-brand">Tentang Kami</Link></li>
              <li><Link href="/privasi" className="text-gray-600 hover:text-brand">Kebijakan Privasi</Link></li>
              <li><Link href="/syarat" className="text-gray-600 hover:text-brand">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
        </div>
        <div className="text-center pt-8 mt-8 border-t border-gray-200 text-xs text-gray-600">
          © {new Date().getFullYear()} Arnes Dive Shop. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
