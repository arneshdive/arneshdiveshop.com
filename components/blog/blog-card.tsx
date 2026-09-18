import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { AnimatedUnderline } from '@/components/ui/animated-underline';
import type { BlogPost } from '@/lib/db';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface BlogCardProps {
  post: BlogPost;
  priority?: boolean;
}

export function BlogCard({ post, priority = false }: BlogCardProps) {
  return (
    <article className="group flex h-full flex-col">
      <Link
        href={`/blog/${post.slug}`}
        className="relative mb-5 block aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100"
        aria-label={post.title}
      >
        <Image
          src={post.coverImageUrl}
          alt={post.coverImageAlt}
          fill
          preload={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-900 backdrop-blur-sm">
          {post.category}
        </span>
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.13em] text-neutral-500">
          <time dateTime={post.publishedAt?.toISOString()}>
            {post.publishedAt ? dateFormatter.format(post.publishedAt) : 'Segera terbit'}
          </time>
          <span aria-hidden="true">·</span>
          <span>{post.readTimeMinutes} menit baca</span>
        </div>
        <h2 className="mb-3 text-2xl font-bold leading-[1.08] tracking-[-0.025em] text-neutral-900 lg:text-[28px]">
          <Link href={`/blog/${post.slug}`} className="decoration-1 underline-offset-4 group-hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="mb-5 line-clamp-3 text-sm leading-6 text-neutral-600">{post.excerpt}</p>
        <Link
          href={`/blog/${post.slug}`}
          className="mt-auto inline-flex w-fit items-center gap-2 text-sm font-medium text-neutral-900"
        >
          <AnimatedUnderline>Baca artikel</AnimatedUnderline>
          <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
