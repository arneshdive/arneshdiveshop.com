import Link from 'next/link';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col font-sans text-sm leading-relaxed">
      {/* Top Bar */}
      <div className="bg-gray-200 py-2 text-center text-xs">
        Gratis Ongkir untuk pembelian di atas Rp 500.000
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 py-4 border-b border-gray-200 max-w-7xl mx-auto w-full">
        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-gray-600"
          type="button"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex gap-6">
          <Link href="/" className="text-gray-600 hover:text-brand text-sm">Beranda</Link>
          <Link href="/freediving" className="text-gray-600 hover:text-brand text-sm">Freediving</Link>
          <Link href="/scuba" className="text-gray-600 hover:text-brand text-sm">Scuba</Link>
          <Link href="/aksesoris" className="text-gray-600 hover:text-brand text-sm">Aksesoris</Link>
          <Link href="/sale" className="text-red-500 hover:text-red-700 text-sm">Sale</Link>
        </div>

        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-brand absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
        >
          ARNES DIVE
        </Link>

        {/* Actions */}
        <div className="flex gap-4 text-gray-600">
          <Link href="/search" className="hidden sm:block hover:text-brand text-sm">[Cari]</Link>
          <Link href="/wishlist" className="hover:text-brand text-sm">[Wishlist]</Link>
          <Link href="/cart" className="hover:text-brand text-sm">[Keranjang]</Link>
          <Link href="/account" className="hidden sm:block hover:text-brand text-sm">[Akun]</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
