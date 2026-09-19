export default function ProdukLoading() {
  return (
    <>
      {/* Breadcrumb skeleton */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 pt-4">
        <div className="h-4 w-48 bg-neutral-200 animate-pulse rounded" />
      </div>

      {/* Banner skeleton */}
      <section className="bg-gradient-to-r from-neutral-700 to-neutral-500 text-white py-12 lg:py-16 px-4 lg:px-12 mt-4">
        <div className="max-w-[1440px] mx-auto">
          <div className="h-10 w-64 bg-white/20 animate-pulse rounded mb-2" />
          <div className="h-5 w-80 bg-white/20 animate-pulse rounded" />
        </div>
      </section>

      {/* Main Content skeleton */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters skeleton */}
          <div className="w-full lg:w-64 space-y-6">
            <div className="h-6 w-24 bg-neutral-200 animate-pulse rounded" />
            <div className="space-y-3">
              <div className="h-4 w-32 bg-neutral-200 animate-pulse rounded" />
              <div className="h-4 w-28 bg-neutral-200 animate-pulse rounded" />
              <div className="h-4 w-36 bg-neutral-200 animate-pulse rounded" />
            </div>
          </div>

          {/* Products grid skeleton */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <div className="h-5 w-32 bg-neutral-200 animate-pulse rounded" />
              <div className="h-9 w-40 bg-neutral-200 animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] bg-neutral-200 animate-pulse rounded-lg" />
                  <div className="h-4 w-3/4 bg-neutral-200 animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-neutral-200 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
