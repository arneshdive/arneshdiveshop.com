import { cache } from 'react';
import { and, asc, desc, eq, isNull, lte, ne, or } from 'drizzle-orm';
import { blogPosts, db, type DivingType } from '@/lib/db';

function publishedCondition() {
  return and(
    eq(blogPosts.isPublished, true),
    or(lte(blogPosts.publishedAt, new Date()), isNull(blogPosts.publishedAt)),
  );
}

/**
 * Public blog queries intentionally read from the database. There is no admin
 * surface for editorial content: posts can be inserted or edited directly in
 * `blog_posts`, then appear on the storefront on the next route revalidation.
 */
export const getPublishedBlogPosts = cache(async () => {
  return db
    .select()
    .from(blogPosts)
    .where(publishedCondition())
    .orderBy(desc(blogPosts.isFeatured), asc(blogPosts.sortOrder), desc(blogPosts.publishedAt));
});

export const getBlogPostBySlug = cache(async (slug: string) => {
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), publishedCondition()))
    .limit(1);

  return post;
});

export async function getRelatedBlogPosts(id: string, category: string, limit = 3) {
  return db
    .select()
    .from(blogPosts)
    .where(and(ne(blogPosts.id, id), eq(blogPosts.category, category), publishedCondition()))
    .orderBy(asc(blogPosts.sortOrder), desc(blogPosts.publishedAt))
    .limit(limit);
}

const DIVING_TYPES: DivingType[] = ['freediving', 'scuba', 'spearfishing', 'surfing', 'swimming'];

export async function getBlogPostForFilter(categorySlug?: string, divingType?: string) {
  const validDivingType = DIVING_TYPES.includes(divingType as DivingType)
    ? (divingType as DivingType)
    : undefined;

  if (categorySlug) {
    const conditions = [
      eq(blogPosts.relatedCategorySlug, categorySlug),
      publishedCondition(),
    ];
    if (validDivingType) conditions.push(eq(blogPosts.divingType, validDivingType));

    const [exactMatch] = await db
      .select()
      .from(blogPosts)
      .where(and(...conditions))
      .orderBy(asc(blogPosts.sortOrder))
      .limit(1);

    if (exactMatch) return exactMatch;

    const [categoryMatch] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.relatedCategorySlug, categorySlug), publishedCondition()))
      .orderBy(asc(blogPosts.sortOrder))
      .limit(1);

    if (categoryMatch) return categoryMatch;
  }

  if (validDivingType) {
    const [divingTypeMatch] = await db
      .select()
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.divingType, validDivingType),
          isNull(blogPosts.relatedCategorySlug),
          publishedCondition(),
        ),
      )
      .orderBy(asc(blogPosts.sortOrder))
      .limit(1);

    return divingTypeMatch;
  }

  return undefined;
}
