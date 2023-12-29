import Link from 'next/link';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onClick?: () => void;
  ctaIcon?: ReactNode;
  size?: 'default' | 'sm' | 'xs';
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onClick,
  ctaIcon,
  size = 'default',
}: EmptyStateProps) {
  const isXs = size === 'xs';

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className={
          isXs
            ? 'w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4'
            : 'w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mb-8'
        }
      >
        <Icon icon={icon} className={isXs ? 'w-8 h-8 text-neutral-400' : 'w-12 h-12 text-neutral-300'} />
      </div>
      <h2
        className={
          isXs
            ? 'text-neutral-600 font-medium tracking-tight mb-1'
            : 'text-2xl lg:text-3xl font-bold tracking-tighter mb-3'
        }
      >
        {title}
      </h2>
      <p className={isXs ? 'text-sm text-neutral-500 mb-6' : 'text-neutral-500 max-w-sm mb-8'}>
        {description}
      </p>
      {ctaLabel &&
        (ctaHref ? (
          <AnimatedButton
            asChild
            variant="outline"
            size={isXs ? 'xs' : 'sm'}
          >
            <Link href={ctaHref} className="flex items-center gap-2">
              {ctaIcon}
              {ctaLabel}
            </Link>
          </AnimatedButton>
        ) : onClick ? (
          <AnimatedButton
            onClick={onClick}
            variant="outline"
            size={isXs ? 'xs' : 'sm'}
          >
            <span className="flex items-center gap-2">
              {ctaIcon}
              {ctaLabel}
            </span>
          </AnimatedButton>
        ) : null)}
    </div>
  );
}
