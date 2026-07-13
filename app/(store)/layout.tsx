import { StoreLayoutClient } from '@/components/layout/store-layout-client';
import { Footer } from '@/components/layout/footer';
import { Toaster } from 'sonner';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col font-sans text-sm leading-relaxed">
      <StoreLayoutClient>{children}</StoreLayoutClient>
      <Footer />
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#fff',
            border: '1px solid #e5e5e5',
            padding: '16px',
            color: '#171717',
          },
          className: 'rounded-xl',
        }}
      />
    </div>
  );
}
