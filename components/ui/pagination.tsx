'use client';

// This component is shared by the admin tables (client-state pagination, no
// `getHref`) and the storefront listing (crawlable `getHref` links). It's
// used inside app/admin, which has no NextIntlClientProvider in its tree, so
// it can't call useTranslations()/next-intl's Link directly — labels come in
// as props (Indonesian defaults preserve today's admin behavior unchanged)
// and links use plain next/link, which works the same for both trees.
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // Builds a real, crawlable URL for a given page. Omit for admin tables
  // (client-state pagination, not indexed); pass it for any public storefront
  // listing — without a real href, page links only exist as onClick handlers
  // and search engines can never discover products past page 1 (that's how
  // 47 products ended up as orphan pages with no incoming internal link).
  getHref?: (page: number) => string;
  labels?: {
    previous: string;
    next: string;
    page: (page: number) => string;
  };
}

const DEFAULT_LABELS = {
  previous: 'Halaman sebelumnya',
  next: 'Halaman berikutnya',
  page: (page: number) => `Halaman ${page}`,
};

export function Pagination({ currentPage, totalPages, onPageChange, getHref, labels = DEFAULT_LABELS }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 4) {
        // Near start: 1 2 3 4 5 ... N
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end: 1 ... N-4 N-3 N-2 N-1 N
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: 1 ... P-1 P P+1 ... N
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const buttonClass =
    'w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-500';

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      {/* Previous */}
      {getHref && currentPage > 1 ? (
        <Link href={getHref(currentPage - 1)} className={buttonClass} aria-label={labels.previous}>
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <button onClick={handlePrevious} disabled={currentPage === 1} className={buttonClass} aria-label={labels.previous}>
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Page Numbers */}
      {getPageNumbers().map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="w-9 h-9 flex items-center justify-center text-neutral-400"
            >
              ...
            </span>
          );
        }

        const isActive = page === currentPage;
        const pageClass = `w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
          isActive
            ? 'bg-neutral-900 text-white'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`;

        return getHref ? (
          <Link
            key={page}
            href={getHref(page)}
            className={pageClass}
            aria-label={labels.page(page)}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </Link>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={pageClass}
            aria-label={labels.page(page)}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* Next */}
      {getHref && currentPage < totalPages ? (
        <Link href={getHref(currentPage + 1)} className={buttonClass} aria-label={labels.next}>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <button onClick={handleNext} disabled={currentPage === totalPages} className={buttonClass} aria-label={labels.next}>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
