import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

const NAV = [
  { label: 'Katalog', href: '/produk' },
  { label: 'Cerita', href: '/lab' },
  { label: 'Cari', href: '/produk' },
  { label: 'Akun', href: '/account' },
];

export function LabHeader() {
  return (
    <div className="absolute inset-x-0 top-0 z-40">
      <div className="bg-[#D6F24A] py-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#111110]">
        Gratis ongkir untuk pembelian di atas Rp 500.000
      </div>

      <header>
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-5 text-[#F5F4F0] sm:px-10 lg:px-16">
          <Link href="/lab" aria-label="Arnesh Dive" className="flex items-center">
            <Logo className="h-4 w-auto" />
          </Link>

          <div className="flex items-center gap-6 text-[12.5px] sm:gap-9">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative hidden tracking-wide after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full sm:inline-block"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/cart" className="tracking-wide">
              Keranjang <span className="opacity-55">(0)</span>
            </Link>
          </div>
        </nav>
      </header>
    </div>
  );
}
