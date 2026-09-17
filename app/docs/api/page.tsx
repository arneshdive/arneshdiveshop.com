import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'Public read-only endpoints for the Arnesh Dive Shop product catalog.',
};

export default function ApiDocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed text-neutral-800">
      <h1 className="text-2xl font-semibold text-neutral-900">API Documentation</h1>
      <p className="mt-2 text-neutral-600">
        These are the only endpoints under <code>/api</code> that are public and read-only (no
        session required). Everything else backs the admin panel or requires authentication. See
        also <code>/.well-known/api-catalog</code> for a machine-readable index of the endpoints
        below.
      </p>

      <section id="search" className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">GET /api/search</h2>
        <p className="mt-1 text-neutral-600">
          Search and filter products, with facets. Backs the storefront search/PLP.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-600">
          <li><code>q</code> — keyword (matches name/description)</li>
          <li><code>category</code>, <code>brand</code> — slug or id</li>
          <li><code>divingType</code> — <code>freediving</code> | <code>scuba</code></li>
          <li><code>newArrival</code>, <code>onSale</code> — <code>true</code> to filter</li>
          <li><code>minPrice</code>, <code>maxPrice</code> — Rupiah (whole numbers)</li>
          <li><code>sort</code> — <code>newest</code> (default) | <code>price-asc</code> | <code>price-desc</code> | <code>popular</code></li>
          <li><code>page</code>, <code>pageSize</code> — pagination (default pageSize 24)</li>
        </ul>
      </section>

      <section id="products" className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">GET /api/products</h2>
        <p className="mt-1 text-neutral-600">
          Paginated product listing with the same filters as search, minus facets.
        </p>
      </section>

      <section id="categories" className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">GET /api/categories</h2>
        <p className="mt-1 text-neutral-600">
          <code>?all=true</code> returns every category unpaginated (for filters); otherwise
          paginated with product counts per category.
        </p>
      </section>

      <section id="brands" className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">GET /api/brands</h2>
        <p className="mt-1 text-neutral-600">
          <code>?all=true</code> returns every brand unpaginated (for filters); otherwise
          paginated.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Prices</h2>
        <p className="mt-1 text-neutral-600">
          All prices are integer <code>priceCents</code> (Indonesian Rupiah, no decimal
          subunits) — divide by 100 for the Rupiah amount.
        </p>
      </section>
    </main>
  );
}
