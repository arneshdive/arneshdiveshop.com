import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="container py-12">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Welcome to Arne&apos;s Dive Shop
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Premium diving equipment and gear for underwater enthusiasts
        </p>
        <Button size="lg">Shop Now</Button>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className="aspect-square bg-muted rounded-md mb-4" />
            <h3 className="font-semibold mb-2">Product {i}</h3>
            <p className="text-sm text-muted-foreground">
              Rp {(i * 500000).toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
