import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col font-sans text-sm leading-relaxed">
      {/* Opaque, higher z-index than the fixed footer so it scrolls over and reveals it */}
      <div className="relative z-10 flex flex-col flex-1 bg-white">
        <Header />

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>

      <Footer />
    </div>
  );
}
