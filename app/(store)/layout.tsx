'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  return (
    <div className="min-h-screen flex flex-col font-sans text-sm leading-relaxed">
      {/* Opaque, higher z-index than the sticky footer layers so it scrolls over and reveals them */}
      <div className="relative z-20 flex flex-col flex-1 bg-white">
        <Header />

        {/* Main Content - add top padding on non-homepage pages to clear fixed header */}
        <main className={`flex-1 ${isHomepage ? '' : 'pt-[72px]'}`}>{children}</main>
      </div>

      <Footer />
    </div>
  );
}
