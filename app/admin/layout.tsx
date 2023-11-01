'use client';

import { AdminSidebar } from '@/components/admin/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Page Content */}
        <main className="flex-1 flex flex-col min-h-0 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
