'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Loader, UserPlus, Ban } from 'lucide-react';
import { useUsers, useUser } from '@/lib/hooks/use-users';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Pagination } from '@/components/ui/pagination';
import { formatDistanceToNow, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { UserRole } from '@/lib/db/schema';

function formatRelativeTime(dateString: Date | string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: idLocale });
}

function formatDate(dateString: Date | string): string {
  return format(new Date(dateString), 'd MMMM yyyy', { locale: idLocale });
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

const roleLabels: Record<UserRole, string> = {
  customer: 'Pelanggan',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const orderStatusLabels: Record<string, string> = {
  pending_payment: 'Menunggu Pembayaran',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
  refunded: 'Dikembalikan',
};

const orderStatusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-neutral-100 text-neutral-700',
};

function InviteAdminModal({
  isOpen,
  onClose,
  onInvite,
  isLoading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: 'admin' | 'super_admin') => void;
  isLoading: boolean;
  error: Error | null;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite(email, role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-900">Undang Admin</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
              className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error.message}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="px-6 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Mengirim...' : 'Kirim Undangan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmBlockModal({
  isOpen,
  user,
  onConfirm,
  onClose,
  isLoading,
}: {
  isOpen: boolean;
  user: { name: string | null; email: string; blockedAt: Date | null } | null;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  if (!isOpen || !user) return null;

  const isBlocking = !user.blockedAt;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="text-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isBlocking ? 'bg-red-100' : 'bg-green-100'
            }`}
          >
            <Icon
              icon={isBlocking ? 'solar:user-block-linear' : 'solar:check-circle-linear'}
              className={`w-6 h-6 ${isBlocking ? 'text-red-600' : 'text-green-600'}`}
            />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {isBlocking ? 'Blokir Pengguna?' : 'Buka Blokir Pengguna?'}
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            {isBlocking ? (
              <>
                <span className="font-medium text-neutral-700">{user.name || user.email}</span>{' '}
                tidak akan dapat login atau mengakses akun.
              </>
            ) : (
              <>
                <span className="font-medium text-neutral-700">{user.name || user.email}</span>{' '}
                akan dapat login dan mengakses akun kembali.
              </>
            )}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                isBlocking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Memproses...' : isBlocking ? 'Blokir' : 'Buka Blokir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDetailDrawer({
  userId,
  onClose,
  onBlock,
  isBlocking,
}: {
  userId: string | null;
  onClose: () => void;
  onBlock: (id: string, blocked: boolean) => void;
  isBlocking: boolean;
}) {
  const { user, isLoading } = useUser(userId);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const handleBlockConfirm = () => {
    if (user) {
      onBlock(user.id, !user.blockedAt);
      setShowBlockConfirm(false);
    }
  };

  return (
    <Drawer open={!!userId} onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent className="h-screen w-full max-w-xl mt-0 rounded-none right-0 left-auto top-0 bottom-0">
        <div className="h-full overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                <Icon icon="solar:user-linear" className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-600 font-medium tracking-tight">Pengguna tidak ditemukan</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                      {user.name || 'Tanpa Nama'}
                    </h2>
                    {user.blockedAt && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Diblokir
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">{user.email}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                >
                  <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
                </button>
              </div>

              {/* Role Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium">
                  <Icon icon="solar:shield-check-linear" className="w-4 h-4" />
                  {roleLabels[user.role]}
                </span>
              </div>

              {/* Account Info */}
              <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
                  Akun
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Icon icon="solar:letter-linear" className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-700">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon icon="solar:check-circle-linear" className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-700">
                      {user.emailVerified ? (
                        <span className="flex items-center gap-1.5">
                          <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-green-500" />
                          Email terverifikasi
                        </span>
                      ) : (
                        <span className="text-neutral-400">Email belum terverifikasi</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon icon="solar:calendar-linear" className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-700">
                      Bergabung {formatRelativeTime(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Block/Unblock Button */}
              {user.role !== 'super_admin' && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowBlockConfirm(true)}
                    disabled={isBlocking}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      user.blockedAt
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    } disabled:opacity-50`}
                  >
                    <Ban className="w-4 h-4" />
                    {user.blockedAt ? 'Buka Blokir Pengguna' : 'Blokir Pengguna'}
                  </button>
                  <p className="text-xs text-neutral-500 mt-2 text-center">
                    {user.blockedAt
                      ? 'Pengguna dapat login dan mengakses akun setelah blokir dibuka'
                      : 'Pengguna yang diblokir tidak dapat login atau mengakses akun'}
                  </p>
                </div>
              )}

              {/* Customer Profile */}
              {user.customer ? (
                <>
                  {/* Contact Info */}
                  <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
                      Kontak
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Icon icon="solar:user-linear" className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm text-neutral-700">
                          {user.customer.firstName} {user.customer.lastName}
                        </span>
                      </div>
                      {user.customer.phone && (
                        <div className="flex items-center gap-3">
                          <Icon icon="solar:phone-linear" className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700">{user.customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
                      Statistik Belanja
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-neutral-500">Total Belanja</p>
                        <p className="text-lg font-semibold text-neutral-900">
                          {formatPrice(user.customer.totalSpentCents)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Total Pesanan</p>
                        <p className="text-lg font-semibold text-neutral-900">
                          {user.customer.orders?.length ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Addresses */}
                  {user.customer.addresses && user.customer.addresses.length > 0 && (
                    <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
                        Alamat ({user.customer.addresses.length})
                      </h3>
                      <div className="space-y-4">
                        {user.customer.addresses.map((address) => (
                          <div
                            key={address.id}
                            className="pb-4 last:pb-0 last:border-0 border-b border-neutral-200"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium text-neutral-900">
                                {address.firstName} {address.lastName}
                              </p>
                              {address.isDefault && (
                                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600">
                                  Utama
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-neutral-600">
                              <p>
                                {address.address1}
                                {address.address2 && `, ${address.address2}`}
                              </p>
                              <p>
                                {address.rajaongkirCityName || address.rajaongkirCity},{' '}
                                {address.rajaongkirProvince}
                              </p>
                              <p>{address.rajaongkirPostalCode}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Orders */}
                  {user.customer.orders && user.customer.orders.length > 0 && (
                    <div className="bg-neutral-50 rounded-2xl p-5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
                        Pesanan Terbaru
                      </h3>
                      <div className="space-y-3">
                        {user.customer.orders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between py-2">
                            <div>
                              <p className="font-medium text-neutral-900 text-sm">
                                #{order.orderNumber}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-medium text-neutral-900">
                                {formatPrice(order.totalCents)}
                              </p>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${orderStatusColors[order.status]}`}
                              >
                                {orderStatusLabels[order.status]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-neutral-50 rounded-2xl p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    Profil Pelanggan
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Pengguna ini belum memiliki profil pelanggan
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Block Confirmation Modal */}
          <ConfirmBlockModal
            isOpen={showBlockConfirm}
            user={user}
            onConfirm={handleBlockConfirm}
            onClose={() => setShowBlockConfirm(false)}
            isLoading={isBlocking}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const { users, pagination, isLoading, blockUser, inviteAdmin, isBlocking, isInviting, inviteError } =
    useUsers(page);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleBlock = (id: string, blocked: boolean) => {
    blockUser({ id, blocked });
  };

  const handleInvite = (email: string, role: 'admin' | 'super_admin') => {
    inviteAdmin({ email, role });
    setIsInviteModalOpen(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pengguna</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola pengguna dan role akses</p>
        </div>
        <AnimatedButton onClick={() => setIsInviteModalOpen(true)} size="xs">
          <UserPlus className="w-4 h-4" />
          <span className="text-sm font-medium tracking-wide">Undang Admin</span>
        </AnimatedButton>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-8 h-8 text-neutral-400 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
            <Icon icon="solar:users-group-rounded-linear" className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium tracking-tight mb-1">Belum ada pengguna</p>
          <p className="text-sm text-neutral-500">
            Pengguna akan muncul setelah melakukan pendaftaran
          </p>
        </div>
      )}

      {/* User List */}
      {!isLoading && users.length > 0 && (
        <>
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Pengguna
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-neutral-50 transition-colors ${user.blockedAt ? 'opacity-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                          {user.blockedAt ? (
                            <Icon icon="solar:user-block-linear" className="w-5 h-5 text-red-400" />
                          ) : (
                            <Icon icon="solar:user-linear" className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">
                            {user.name || 'Tanpa Nama'}
                            {user.blockedAt && (
                              <span className="ml-2 text-xs text-red-500">(Diblokir)</span>
                            )}
                          </p>
                          <p className="text-sm text-neutral-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-600">{roleLabels[user.role]}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-neutral-500">
                        {user.emailVerified ? 'Terverifikasi' : 'Belum terverifikasi'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUserId(user.id)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                          aria-label="Lihat detail pengguna"
                        >
                          <Icon icon="solar:eye-linear" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* User Detail Drawer */}
      <UserDetailDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onBlock={handleBlock}
        isBlocking={isBlocking}
      />

      {/* Invite Admin Modal */}
      <InviteAdminModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInvite}
        isLoading={isInviting}
        error={inviteError}
      />
    </div>
  );
}
