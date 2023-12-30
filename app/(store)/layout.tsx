import { StoreLayoutClient } from '@/components/layout/store-layout-client';
import { Footer } from '@/components/layout/footer';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col font-sans text-sm leading-relaxed">
      <StoreLayoutClient>{children}</StoreLayoutClient>
      <Footer />
    </div>
  );
}
