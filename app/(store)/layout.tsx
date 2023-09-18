export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="font-bold text-xl">
            Arne&apos;s Dive Shop
          </a>
          <nav className="flex items-center gap-6">
            <a href="/products" className="text-sm font-medium hover:underline">
              Products
            </a>
            <a href="/categories" className="text-sm font-medium hover:underline">
              Categories
            </a>
            <a href="/cart" className="text-sm font-medium hover:underline">
              Cart
            </a>
            <a href="/login" className="text-sm font-medium hover:underline">
              Login
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Arne&apos;s Dive Shop. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
