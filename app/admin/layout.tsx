'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Toast } from '@/components/ui/toast';

export default function AdminLayout({
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
      <div className="min-h-screen flex justify-center bg-neutral-100">
        {/* Centered Container */}
        <div className="w-full max-w-[1920px] flex bg-neutral-50">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-screen overflow-y-auto">
            {/* Page Content */}
            <main className="flex-1 flex flex-col min-h-0 p-6 lg:p-8">
              <div className="w-full max-w-[1440px] mx-auto flex-1 flex flex-col min-h-0">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
      <Toast />
    </QueryClientProvider>
  );
}
