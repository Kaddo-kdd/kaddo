import { getCollection, type CollectionEntry } from 'astro:content'

export type BlogPost = CollectionEntry<'blog'>
export type Locale = 'en' | 'es'

// Drafts render in dev (to prepare content) but never in production builds.
function isVisible(post: BlogPost): boolean {
  return import.meta.env.PROD ? post.data.draft !== true : true
}

/** The URL slug of a post, shared across locales. Posts live under `en/` or `es/`; the leading
 *  locale folder is stripped so an EN and ES article with the same name share one slug (hreflang). */
export function baseSlug(post: BlogPost): string {
  return post.id.replace(/^(en|es)\//, '')
}

/** Localized blog path for a post, e.g. /blog/foo/ or /es/blog/foo/. */
export function postPath(post: BlogPost): string {
  const slug = baseSlug(post)
  return post.data.locale === 'es' ? `/es/blog/${slug}/` : `/blog/${slug}/`
}

export function blogIndexPath(locale: Locale): string {
  return locale === 'es' ? '/es/blog/' : '/blog/'
}

export function tagPath(locale: Locale, tag: string): string {
  const base = locale === 'es' ? '/es/blog/tags/' : '/blog/tags/'
  return `${base}${encodeURIComponent(tag)}/`
}

/** Published, visible posts for a locale, newest first. */
export async function getPosts(locale: Locale): Promise<BlogPost[]> {
  const posts = await getCollection('blog', isVisible)
  return posts
    .filter((p) => p.data.locale === locale)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
}

/** All distinct tags for a locale, with their post counts, alphabetical. */
export async function getTags(locale: Locale): Promise<{ tag: string; count: number }[]> {
  const posts = await getPosts(locale)
  const counts = new Map<string, number>()
  for (const p of posts) for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => a.tag.localeCompare(b.tag))
}

/** Deterministic related posts by shared tags (most overlap first), excluding the post itself. */
export async function getRelated(post: BlogPost, max = 3): Promise<BlogPost[]> {
  const locale = post.data.locale as Locale
  const tags = new Set(post.data.tags)
  if (tags.size === 0) return []
  const others = (await getPosts(locale)).filter((p) => p.id !== post.id)
  return others
    .map((p) => ({ p, overlap: p.data.tags.filter((t) => tags.has(t)).length }))
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.p.data.publishedAt.getTime() - a.p.data.publishedAt.getTime())
    .slice(0, max)
    .map((x) => x.p)
}

/**
 * If an equivalent post exists in the other locale (same base slug), return its path — used for
 * hreflang. Never invents an alternate just because slugs could collide: both files must exist.
 */
export async function getAlternate(post: BlogPost): Promise<{ locale: Locale; path: string } | null> {
  const other: Locale = post.data.locale === 'es' ? 'en' : 'es'
  const slug = baseSlug(post)
  const candidates = await getPosts(other)
  const match = candidates.find((p) => baseSlug(p) === slug)
  return match ? { locale: other, path: postPath(match) } : null
}

export function formatDate(date: Date, locale: Locale): string {
  // Format in UTC: frontmatter dates like 2026-10-04 parse as UTC midnight, so formatting in the
  // local timezone could render the previous day.
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(date)
}
