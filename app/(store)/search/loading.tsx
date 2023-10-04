export default function SearchLoading() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-12 pt-20 py-8">
      {/* Search input skeleton */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
      </div>

      {/* Banner skeleton */}
      <div className="h-32 bg-neutral-100 rounded-lg animate-pulse mb-8" />

      {/* Content skeleton */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter skeleton */}
        <div className="hidden lg:block w-64 space-y-6">
          <div className="h-40 bg-neutral-100 rounded animate-pulse" />
          <div className="h-32 bg-neutral-100 rounded animate-pulse" />
        </div>

        {/* Grid skeleton */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
