import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Icon } from '@iconify/react';
import { BlogCard } from '@/components/blog/blog-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { USPSection } from '@/components/layout/usp-section';
import { JsonLd } from '@/components/seo/json-ld';
import { getBlogPostBySlug, getRelatedBlogPosts } from '@/lib/queries/blog';
import { siteConfig } from '@/config/site';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function headingId(heading: string) {
  return heading
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) return { title: 'Artikel tidak ditemukan' };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `${siteConfig.url}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `${siteConfig.url}/blog/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author],
      images: [{ url: post.coverImageUrl, alt: post.coverImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const relatedPosts = await getRelatedBlogPosts(post.id, post.category);
  const articleUrl = `${siteConfig.url}/blog/${post.slug}`;
  const articleImage = post.coverImageUrl.startsWith('http')
    ? post.coverImageUrl
    : `${siteConfig.url}${post.coverImageUrl}`;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          image: [articleImage],
          datePublished: post.publishedAt?.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          author: { '@type': 'Organization', name: post.author },
          publisher: {
            '@type': 'Organization',
            name: siteConfig.name,
            logo: { '@type': 'ImageObject', url: `${siteConfig.url}/icon.png` },
          },
          articleSection: post.category,
          citation: post.sources.map((source) => source.url),
          articleBody: post.content
            .flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets ?? [])])
            .join(' '),
          url: articleUrl,
          mainEntityOfPage: articleUrl,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: 'Dive Journal', item: `${siteConfig.url}/blog` },
            { '@type': 'ListItem', position: 3, name: post.title, item: articleUrl },
          ],
        }}
      />

      <article>
        <header className="bg-neutral-50">
          <div className="mx-auto max-w-[1240px] px-6 pb-12 pt-6 lg:px-12 lg:pb-16 lg:pt-10">
            <nav className="mb-14 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.13em] text-neutral-500 lg:mb-20">
              <Link href="/" className="hover:text-neutral-900">Beranda</Link>
              <span aria-hidden="true">/</span>
              <Link href="/blog" className="hover:text-neutral-900">Journal</Link>
              <span aria-hidden="true">/</span>
              <span className="text-neutral-900">{post.category}</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[1fr_0.34fr] lg:items-end">
              <div>
                <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
                  {post.category}
                </p>
                <h1 className="max-w-[15ch] text-[clamp(2.75rem,6.5vw,6.4rem)] font-bold leading-[0.91] tracking-[-0.055em] text-neutral-950">
                  {post.title}
                </h1>
              </div>
              <div className="border-l border-neutral-300 pl-6">
                <p className="mb-7 text-base leading-7 text-neutral-600">{post.excerpt}</p>
                <div className="text-[11px] uppercase leading-5 tracking-[0.12em] text-neutral-500">
                  <span>{post.author}</span>
                  <br />
                  <time dateTime={post.publishedAt?.toISOString()}>
                    {post.publishedAt ? dateFormatter.format(post.publishedAt) : 'Segera terbit'}
                  </time>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>{post.readTimeMinutes} menit baca</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-0 sm:px-6 lg:px-12">
          <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 sm:rounded-lg lg:aspect-[16/8]">
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt}
              fill
              preload
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="mx-auto grid max-w-[1120px] gap-12 px-6 py-16 lg:grid-cols-[220px_minmax(0,680px)] lg:gap-20 lg:px-12 lg:py-24">
          <aside className="hidden lg:block">
            <div className="sticky top-28 border-t border-neutral-900 pt-5">
              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">Dalam artikel ini</p>
              <ol className="space-y-3">
                {post.content.map((section, index) => (
                  <li key={section.heading} className="grid grid-cols-[22px_1fr] text-xs leading-5 text-neutral-600">
                    <span className="text-neutral-400">{String(index + 1).padStart(2, '0')}</span>
                    <a href={`#${headingId(section.heading)}`} className="hover:text-neutral-950">
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <div>
            <div className="space-y-16">
              {post.content.map((section, sectionIndex) => (
                <section key={section.heading} id={headingId(section.heading)} className="scroll-mt-28">
                  <div className="mb-5 flex items-baseline gap-3">
                    <span className="text-[10px] font-semibold tracking-[0.18em] text-neutral-400">
                      {String(sectionIndex + 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-2xl font-bold leading-tight tracking-[-0.03em] text-neutral-950 lg:text-3xl">
                      {section.heading}
                    </h2>
                  </div>

                  <div className="space-y-5 text-[16px] leading-8 text-neutral-700 lg:text-[17px]">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>

                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="mt-7 space-y-3 border-l-2 border-sky-300 pl-6 text-[15px] leading-7 text-neutral-700">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="relative before:absolute before:-left-4 before:content-['—']">{bullet}</li>
                      ))}
                    </ul>
                  )}

                  {section.note && (
                    <div className="mt-8 rounded-lg bg-neutral-900 p-6 text-white lg:p-8">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/70">
                        {section.note.title}
                      </p>
                      <p className="text-sm leading-7 text-white/80">{section.note.body}</p>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {post.sources.length > 0 && (
              <section className="mt-20 border-t border-neutral-300 pt-8" aria-labelledby="sources-heading">
                <p id="sources-heading" className="mb-4 text-xs uppercase tracking-[0.16em] text-neutral-500">
                  Sumber &amp; bacaan lanjut
                </p>
                <ul className="space-y-3 text-sm leading-6 text-neutral-700">
                  {post.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
                      >
                        {source.title}
                      </a>{' '}
                      <span className="text-neutral-500">— {source.publisher}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-xs leading-5 text-neutral-500">
                  Tautan ini dipakai sebagai rujukan umum dan dibuka di situs penerbitnya. Artikel
                  ini tidak menggantikan pelatihan, arahan buddy, manual produsen, atau pemeriksaan
                  teknisi yang sesuai.
                </p>
              </section>
            )}

            {post.ctaHref && post.ctaLabel && (
              <div className="mt-20 border-y border-neutral-300 py-8">
                <p className="mb-4 text-xs uppercase tracking-[0.16em] text-neutral-500">Lanjutkan dari sini</p>
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                  <p className="max-w-sm text-lg font-semibold leading-7 text-neutral-900">
                    Cari perlengkapan berdasarkan kebutuhan Anda, bukan sekadar label produknya.
                  </p>
                  <AnimatedButton asChild size="sm">
                    <Link href={post.ctaHref} className="inline-flex items-center gap-2.5">
                      {post.ctaLabel}
                      <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
                    </Link>
                  </AnimatedButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="border-t border-neutral-200 py-20 lg:py-28">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-500">Lanjut membaca</p>
                <h2 className="text-3xl font-bold tracking-tighter lg:text-[44px]">Artikel terkait</h2>
              </div>
              <AnimatedButton asChild variant="outline" size="xs" className="!hidden sm:!flex">
                <Link href="/blog" className="inline-flex items-center gap-2.5">
                  Semua artikel
                  <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
                </Link>
              </AnimatedButton>
            </div>
            <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative z-10 -mb-16 lg:-mb-20">
        <USPSection />
      </section>
    </>
  );
}
