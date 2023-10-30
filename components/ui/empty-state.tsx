import Link from 'next/link';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onClick?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, ctaHref, onClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 lg:py-24 text-center">
      <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-8">
        <Icon icon={icon} className="w-12 h-12 text-neutral-300" />
      </div>
      <h2 className="text-2xl lg:text-3xl font-bold tracking-tighter mb-3">
        {title}
      </h2>
      <p className="text-neutral-500 max-w-sm mb-8">
        {description}
      </p>
      {ctaLabel && (ctaHref ? (
        <AnimatedButton asChild variant="outline" className="px-8 py-4 text-sm uppercase tracking-wider">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </AnimatedButton>
      ) : onClick ? (
        <AnimatedButton onClick={onClick} variant="outline" className="px-8 py-4 text-sm uppercase tracking-wider">
          {ctaLabel}
        </AnimatedButton>
      ) : null)}
    </div>
  );
}
