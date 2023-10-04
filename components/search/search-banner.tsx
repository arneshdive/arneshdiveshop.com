import { CATEGORY_CONFIG, type CategoryKey } from '@/lib/data/search-utils';
import { cn } from '@/lib/utils/cn';

interface SearchBannerProps {
  query: string;
  resultCount: number;
  activeCategory?: CategoryKey;
}

export function SearchBanner({ query, resultCount, activeCategory }: SearchBannerProps) {
  const config = activeCategory ? CATEGORY_CONFIG[activeCategory] : null;

  // Default neutral banner when no category filter
  const gradient = config?.gradient || 'from-neutral-700 to-neutral-500';
  const title = config ? `${config.label}: "${query}"` : `Hasil untuk "${query}"`;
  const description = config?.description || `Ditemukan ${resultCount} produk untuk pencarian Anda.`;

  return (
    <section
      className={cn(
        'bg-gradient-to-r text-white py-12 lg:py-16 px-4',
        gradient
      )}
    >
      <div className="max-w-[1440px] mx-auto">
        <h1 className="text-3xl lg:text-4xl font-semibold mb-2">{title}</h1>
        <p className="text-white/80 max-w-xl">{description}</p>
      </div>
    </section>
  );
}
