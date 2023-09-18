import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-muted/40">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="font-bold text-lg">
            Admin Panel
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          <Link
            href="/admin"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Products
          </Link>
          <Link
            href="/admin/categories"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Categories
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Orders
          </Link>
          <Link
            href="/admin/customers"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Customers
          </Link>
          <Link
            href="/admin/promotions"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Promotions
          </Link>
          <Link
            href="/admin/banners"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Banners
          </Link>
        </nav>
      </aside>
      <main className="flex-1">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="font-semibold">Arne&apos;s Dive Shop Admin</h1>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
