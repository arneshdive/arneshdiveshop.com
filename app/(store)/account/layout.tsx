'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { USPSection } from '@/components/layout/usp-section';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds - data stays fresh
        gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
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

      <Toaster 
        position="bottom-center" 
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'flex items-center gap-3 bg-white rounded-2xl border border-neutral-200 p-4 shadow-lg',
            title: 'text-sm font-medium text-neutral-900',
            description: 'text-sm text-neutral-500',
            success: '',
            error: '',
          },
        }}
        icons={{
          success: (
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ),
          error: (
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ),
        }}
      />
    </QueryClientProvider>
  );
}
