'use client';

import { Icon } from '@iconify/react';

const stats = [
  {
    label: 'Total Pesanan',
    value: '0',
    icon: 'solar:document-text-linear',
    trend: '+0%',
    trendUp: true,
  },
  {
    label: 'Pendapatan',
    value: 'Rp 0',
    icon: 'solar:wallet-linear',
    trend: '+0%',
    trendUp: true,
  },
  {
    label: 'Pelanggan',
    value: '0',
    icon: 'solar:users-group-rounded-linear',
    trend: '+0%',
    trendUp: true,
  },
  {
    label: 'Produk',
    value: '0',
    icon: 'solar:box-linear',
    trend: null,
    trendUp: null,
  },
];

export default function AdminDashboard() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Ringkasan aktivitas toko Anda</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-neutral-200 p-6 hover:border-neutral-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                <Icon icon={stat.icon} className="w-5 h-5 text-neutral-600" />
              </div>
              {stat.trend && (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trendUp
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-semibold tracking-tight text-neutral-900 mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-neutral-500 tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Pesanan Terbaru</h2>
          <a
            href="/admin/orders"
            className="text-sm font-medium tracking-wide text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Lihat Semua
          </a>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
            <Icon icon="solar:document-text-linear" className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium tracking-tight mb-1">Belum ada pesanan</p>
          <p className="text-sm text-neutral-500">
            Pesanan akan muncul di sini setelah pelanggan mulai melakukan checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
