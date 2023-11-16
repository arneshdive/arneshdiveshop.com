'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { mockOrders, type OrderStatus } from '@/lib/data/mock-orders';
import { OrderListItem } from '@/components/admin/orders/order-list-item';
import { OrderDetail } from '@/components/admin/orders/order-detail';

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

export default function OrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = mockOrders.filter((order) => {
    // Status filter
    if (statusFilter && order.status !== statusFilter) return false;
    
    // Date filter
    if (dateFilter) {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateFilter === 'today') {
        if (orderDate < today) return false;
      } else if (dateFilter === 'this_week') {
        // Start of this week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        if (orderDate < startOfWeek) return false;
      } else if (dateFilter === 'this_month') {
        // Start of this month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (orderDate < startOfMonth) return false;
      }
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.customer.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const selectedOrder = selectedOrderId ? mockOrders.find((o) => o.id === selectedOrderId) ?? null : null;

  return (
    <div className="max-w-7xl flex-1 flex flex-col min-h-0">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pesanan</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola dan pantau pesanan pelanggan</p>
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

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Order List */}
      <div className="w-[360px] flex-shrink-0 flex flex-col bg-white rounded-2xl">
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

        {/* Order List */}
        <div className="flex-1 overflow-y-auto p-4 pt-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
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
      </div>

      {/* Right: Order Detail */}
      <div className="flex-1 min-w-0 bg-white rounded-2xl overflow-hidden">
        <OrderDetail order={selectedOrder} />
      </div>
    </div>
  </div>
  );
}
