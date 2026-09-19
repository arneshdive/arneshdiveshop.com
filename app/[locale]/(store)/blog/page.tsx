import Image from 'next/image';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link, getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Icon } from '@iconify/react';
import { BlogCard } from '@/components/blog/blog-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { USPSection } from '@/components/layout/usp-section';
import { JsonLd } from '@/components/seo/json-ld';
import { getPublishedBlogPosts } from '@/lib/queries/blog';
import { siteConfig } from '@/config/site';

export const revalidate = 300;

interface BlogIndexPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BlogIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const title = t('meta.title');
  const description = t('meta.description');
  const canonical = `${siteConfig.url}${getPathname({ href: '/blog', locale })}`;

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${siteConfig.url}${getPathname({ href: '/blog', locale: loc })}`;
  }
  languages['x-default'] = `${siteConfig.url}/blog`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: t('meta.ogTitle'),
      description: t('meta.ogDescription'),
      url: canonical,
      siteName: siteConfig.name,
      type: 'website',
    },
  };
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default async function PanduanIndexPage() {
  const posts = await getPublishedBlogPosts();
  const featuredPost = posts.find((post) => post.isFeatured) ?? posts[0];
  const remainingPosts = featuredPost ? posts.filter((post) => post.id !== featuredPost.id) : [];
  const t = await getTranslations('blog');

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Arnesh Dive Journal',
          description: t('meta.description'),
          url: `${siteConfig.url}/blog`,
          blogPost: posts.map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            url: `${siteConfig.url}/blog/${post.slug}`,
            image: post.coverImageUrl.startsWith('http')
              ? post.coverImageUrl
              : `${siteConfig.url}${post.coverImageUrl}`,
          })),
        }}
      />

      {featuredPost ? (
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-[1440px] px-4 lg:px-12">
            <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-widest text-neutral-500 lg:text-xs">
                  {siteConfig.name}
                </p>
                <h1 className="mb-2 text-3xl font-bold tracking-tighter lg:text-[44px]">{t('title')}</h1>
              </div>
              <p className="max-w-md text-sm leading-6 text-neutral-500 lg:text-base">
                {t('list.description')}
              </p>
            </div>

            <article className="mb-9 grid overflow-hidden rounded-lg bg-neutral-50 text-neutral-900 lg:grid-cols-2">
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="relative block aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[360px]"
                aria-label={featuredPost.title}
              >
                <Image
                  src={featuredPost.coverImageUrl}
                  alt={featuredPost.coverImageAlt}
                  fill
                  preload
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 hover:scale-[1.025]"
                />
              </Link>
              <div className="flex flex-col justify-between p-7 sm:p-8 lg:p-10">
                <div>
                  <div className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    <span>{featuredPost.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{t('featuredLabel')}</span>
                  </div>
                  <h2 className="mb-4 text-3xl font-bold leading-[1.04] tracking-[-0.035em] lg:text-4xl">
                    {featuredPost.title}
                  </h2>
                  <p className="text-sm leading-6 text-neutral-600 lg:text-base lg:leading-7">{featuredPost.excerpt}</p>
                </div>
                <div className="mt-8 flex items-end justify-between gap-6 border-t border-neutral-300 pt-5">
                  <div className="text-xs leading-5 text-neutral-500">
                    <time dateTime={featuredPost.publishedAt?.toISOString()}>
                      {featuredPost.publishedAt
                        ? dateFormatter.format(featuredPost.publishedAt)
                        : t('comingSoon')}
                    </time>
                    <br />
                    {t('readTime', { minutes: featuredPost.readTimeMinutes })}
                  </div>
                  <AnimatedButton asChild size="xs">
                    <Link href={`/blog/${featuredPost.slug}`} className="inline-flex items-center gap-2.5">
                      {t('readNow')}
                      <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
                    </Link>
                  </AnimatedButton>
                </div>
              </div>
            </article>

            {remainingPosts.length > 0 && (
              <>
                <div className="mb-9 flex items-center gap-4">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
                    {t('moreArticles')}
                  </span>
                  <div className="h-px w-full bg-neutral-200" />
                </div>
                <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-20">
                  {remainingPosts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      ) : (
        <section className="px-6 py-20 text-center text-neutral-500">
          {t('emptyState')}
        </section>
      )}

      <section className="border-y border-neutral-200 bg-neutral-50 py-16 lg:py-20">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">{t('exploreEyebrow')}</p>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight tracking-[-0.035em] lg:text-5xl">
              {t('exploreHeading')}
            </h2>
          </div>
          <AnimatedButton asChild size="sm">
            <Link href="/produk" className="inline-flex items-center gap-2.5">
              {t('exploreCatalogCta')}
              <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
            </Link>
          </AnimatedButton>
        </div>
      </section>

      <section className="relative z-10 -mb-16 lg:-mb-20">
        <USPSection />
      </section>
    </>
  );
}
