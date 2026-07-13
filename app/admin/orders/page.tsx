'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderListItem } from '@/components/admin/orders/order-list-item';
import { OrderDetail } from '@/components/admin/orders/order-detail';
import type { OrderStatus } from '@/lib/db/schema';

type DateFilter = '' | 'today' | 'this_week' | 'this_month';

const statusTabs: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'pending_payment', label: 'Dipesan' },
  { value: 'processing', label: 'Dibayar' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'delivered', label: 'Selesai' },
];

const dateFilterOptions: { value: DateFilter; label: string }[] = [
  { value: '', label: 'Semua Tanggal' },
  { value: 'today', label: 'Hari Ini' },
  { value: 'this_week', label: 'Minggu Ini' },
  { value: 'this_month', label: 'Bulan Ini' },
];

// API Types
interface ApiOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  trackingNumber: string | null;
  shippedAt: string | null;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string | null;
  shippingAddress1: string;
  shippingAddress2: string | null;
  shippingCity: string;
  shippingState: string | null;
  shippingPostalCode: string;
  shippingCountry: string;
  notes: string | null;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    name: string;
    quantity: number;
    priceCents: number;
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[] | null;
    };
    variant: { id: string; name: string } | null;
  }>;
  payments: Array<{
    id: string;
    status: 'pending' | 'paid' | 'failed' | 'expired';
    amountCents: number;
    provider: string;
    paymentMethod: string | null;
    paidAt: string | null;
  }>;
}

// Fetch orders from API
async function fetchOrders(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ orders: ApiOrder[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

  const response = await fetch(`/api/orders?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch orders from real API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => fetchOrders({ 
      status: statusFilter || undefined, 
      page: 1, 
      pageSize: 100 
    }),
  });

  const orders = data?.orders ?? [];

  // Client-side filtering for date and search (API handles status)
  const filteredOrders = orders.filter((order) => {
    // Date filter
    if (dateFilter) {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateFilter === 'today') {
        if (orderDate < today) return false;
      } else if (dateFilter === 'this_week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        if (orderDate < startOfWeek) return false;
      } else if (dateFilter === 'this_month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (orderDate < startOfMonth) return false;
      }
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const customerName = `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        customerName.includes(query) ||
        order.customer.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const selectedOrder = selectedOrderId ? orders.find((o) => o.id === selectedOrderId) ?? null : null;

  // Calculate date range from dateFilter
  const getDateRange = (): { startDate?: string; endDate?: string } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return {
          startDate: today.toISOString().slice(0, 10),
          endDate: today.toISOString().slice(0, 10),
        };
      case 'this_week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          startDate: startOfWeek.toISOString().slice(0, 10),
        };
      case 'this_month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: startOfMonth.toISOString().slice(0, 10),
        };
      default:
        return {};
    }
  };

  // Export orders
  const handleExport = async (format: 'csv' | 'excel') => {
    setShowExportMenu(false);
    setIsExporting(true);
    
    try {
      const params = new URLSearchParams({ format });
      const { startDate, endDate } = getDateRange();
      
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (statusFilter) params.set('status', statusFilter);
      
      const response = await fetch(`/api/orders/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export orders');
      }
      
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const defaultFilename = `orders.${format === 'csv' ? 'csv' : 'xlsx'}`;
      const extractedFilename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') ?? '';
      const filename = extractedFilename || defaultFilename;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengekspor pesanan');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle status update success
  const handleStatusUpdateSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
  }, [queryClient]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pesanan</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola dan pantau pesanan pelanggan</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Icon icon="solar:spinner-line" className="w-4 h-4 animate-spin" />
              ) : (
                <Icon icon="solar:download-minimalistic-linear" className="w-4 h-4" />
              )}
              {isExporting ? 'Mengekspor...' : 'Ekspor'}
              <Icon icon="solar:alt-arrow-down-linear" className="w-3 h-3" />
            </button>
            
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Icon icon="solar:document-text-linear" className="w-4 h-4 text-neutral-500" />
                    <div className="text-left">
                      <div className="font-medium">CSV</div>
                      <div className="text-xs text-neutral-500">Format spreadsheet</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Icon icon="solar:document-linear" className="w-4 h-4 text-neutral-500" />
                    <div className="text-left">
                      <div className="font-medium">Excel</div>
                      <div className="text-xs text-neutral-500">Format .xlsx</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Periode:</span>
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 transition-colors text-neutral-700 cursor-pointer"
              >
                {dateFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Icon icon="solar:alt-arrow-down-linear" className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Order List */}
        <div className="w-[400px] flex-shrink-0 flex flex-col bg-white rounded-2xl">
          {/* Filters */}
          <div className="p-4 pb-0 space-y-3">
            {/* Status Tabs */}
            <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                    statusFilter === tab.value
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Search */}
            <div className="relative">
              <Icon icon="solar:magnifer-linear" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="search"
                placeholder="Cari pesanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900 transition-colors"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Icon icon="solar:spinner-line" className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Memuat pesanan...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Icon icon="solar:danger-triangle-linear" className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600">Gagal memuat pesanan</p>
                <button 
                  onClick={() => refetch()}
                  className="mt-2 text-sm text-neutral-600 hover:text-neutral-900 underline"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          )}

          {/* Order List */}
          {!isLoading && !error && (
            <div className="flex-1 overflow-y-auto p-4 pt-3">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="solar:inbox-linear" className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                  <p className="text-neutral-500 text-sm">Tidak ada pesanan</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <OrderListItem
                    key={order.id}
                    order={order}
                    isSelected={selectedOrderId === order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: Order Detail */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl flex flex-col min-h-0">
          <OrderDetail 
            order={selectedOrder} 
            onStatusUpdate={handleStatusUpdateSuccess}
          />
        </div>
      </div>
    </div>
  );
}
