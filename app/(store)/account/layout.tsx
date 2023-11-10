import { AccountSidebar } from '@/components/account/account-sidebar';
import { USPSection } from '@/components/usp-section';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <AccountSidebar />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      {/* Separator */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <hr className="border-neutral-200" />
      </div>

      {/* USP Section - overlaps the footer below it */}
      <section className="relative z-10 -mb-16 lg:-mb-20">
        <USPSection />
      </section>
    </>
  );
}
