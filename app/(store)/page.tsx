import Link from 'next/link';

export default function HomePage() {
  const categories = [
    { name: 'Masker', href: '/freediving?kategori=masker' },
    { name: 'Fin', href: '/freediving?kategori=fin' },
    { name: 'Wetsuit', href: '/freediving?kategori=wetsuit' },
    { name: 'Sabuk', href: '/freediving?kategori=sabuk' },
    { name: 'Aksesoris', href: '/aksesoris' },
  ];

  const featuredProducts = [
    { name: 'Masker Freediving Pro', price: 'Rp 850.000', badge: 'Baru', badgeColor: 'bg-brand' },
    { name: 'Fin Carbón Pro', price: 'Rp 2.500.000', badge: 'Baru', badgeColor: 'bg-brand' },
    { name: 'Wetsuit 3mm Premium', price: 'Rp 1.800.000', badge: null, badgeColor: null },
    { name: 'Snorkel Dry Top', price: 'Rp 250.000', originalPrice: 'Rp 320.000', badge: 'Sale', badgeColor: 'bg-red-500' },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="grid lg:grid-cols-2 min-h-[400px] lg:min-h-[500px]">
        <div className="p-8 lg:p-12 flex flex-col justify-center order-2 lg:order-1">
          <span className="text-xs uppercase tracking-widest text-gray-500 mb-2">Koleksi Terbaru</span>
          <h1 className="text-3xl lg:text-5xl font-semibold mb-4">
            Peralatan Freediving Premium
          </h1>
          <p className="text-gray-600 mb-6 max-w-md">
            Temukan masker, fin, dan aksesoris freediving berkualitas tinggi untuk pengalaman diving terbaik Anda.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/freediving"
              className="bg-brand text-white px-6 py-3 text-xs uppercase tracking-wider hover:bg-gray-700"
            >
              Lihat Koleksi
            </Link>
            <Link
              href="/sale"
              className="border border-brand px-6 py-3 text-xs uppercase tracking-wider hover:bg-gray-100"
            >
              Sale
            </Link>
          </div>
        </div>
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 min-h-[250px] lg:min-h-full order-1 lg:order-2">
          Hero Image
        </div>
      </section>

      {/* Category Strip */}
      <section className="py-8 border-b border-gray-200">
        <div className="flex justify-center gap-6 lg:gap-8 px-4 overflow-x-auto">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                Img
              </div>
              <span className="text-xs lg:text-sm whitespace-nowrap">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl lg:text-2xl font-semibold">Produk Unggulan</h2>
          <p className="text-gray-600 text-sm">Pilihan terbaik untuk freediving dan scuba diving</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {featuredProducts.map((product) => (
            <Link key={product.name} href="/produk/contoh" className="group">
              <div className="aspect-[3/4] bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 mb-2 relative">
                {product.badge && (
                  <span className={`absolute top-2 left-2 ${product.badgeColor} text-white text-[10px] uppercase px-2 py-1`}>
                    {product.badge}
                  </span>
                )}
                Product Image
              </div>
              <h3 className="font-medium text-sm">{product.name}</h3>
              {product.originalPrice ? (
                <p className="text-sm">
                  <span className="text-red-500">{product.price}</span>{' '}
                  <s className="text-gray-400">{product.originalPrice}</s>
                </p>
              ) : (
                <p className="text-gray-600 text-sm">{product.price}</p>
              )}
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/freediving" className="text-sm uppercase border-b border-brand">
            Lihat Semua →
          </Link>
        </div>
      </section>

      {/* Split Banner */}
      <section className="grid md:grid-cols-2">
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 min-h-[300px] lg:min-h-[400px] relative flex items-end p-6 lg:p-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-500">Freediving</span>
            <h3 className="text-2xl lg:text-3xl font-semibold my-2">Koleksi Freediving</h3>
            <Link href="/freediving" className="inline-block border border-brand px-4 py-2 text-xs uppercase hover:bg-white">
              Lihat Koleksi
            </Link>
          </div>
        </div>
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 min-h-[300px] lg:min-h-[400px] relative flex items-end p-6 lg:p-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-500">Scuba</span>
            <h3 className="text-2xl lg:text-3xl font-semibold my-2">Koleksi Scuba</h3>
            <Link href="/scuba" className="inline-block border border-brand px-4 py-2 text-xs uppercase hover:bg-white">
              Lihat Koleksi
            </Link>
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-semibold">#ArnesDive</h2>
            <p className="text-gray-600 text-sm">Bagikan petualangan diving Anda</p>
          </div>
          <span className="text-gray-600 text-sm hidden sm:block">@arnesdive</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`aspect-square bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs ${i > 3 ? 'hidden md:flex' : ''}`}
            >
              UGC {i}
            </div>
          ))}
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl mb-2">🚚</div>
            <h4 className="font-semibold text-sm">Gratis Ongkir</h4>
            <p className="text-xs text-gray-600">Untuk pembelian di atas Rp 500.000</p>
          </div>
          <div>
            <div className="text-3xl mb-2">✓</div>
            <h4 className="font-semibold text-sm">Produk Original</h4>
            <p className="text-xs text-gray-600">100% produk berkualitas</p>
          </div>
          <div>
            <div className="text-3xl mb-2">↩️</div>
            <h4 className="font-semibold text-sm">Easy Return</h4>
            <p className="text-xs text-gray-600">14 hari pengembalian</p>
          </div>
          <div>
            <div className="text-3xl mb-2">💬</div>
            <h4 className="font-semibold text-sm">Support 24/7</h4>
            <p className="text-xs text-gray-600">Siap membantu kapan saja</p>
          </div>
        </div>
      </section>
    </>
  );
}
