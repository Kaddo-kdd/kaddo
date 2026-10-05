import type { APIContext } from 'astro'
import { getPosts, postPath } from '../../../lib/blog'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export async function GET(context: APIContext): Promise<Response> {
  const site = context.site?.href ?? 'https://kaddo.org/'
  const posts = await getPosts('es') // excludes drafts in production builds
  const items = posts
    .map((p) => {
      const url = new URL(postPath(p), site).href
      return (
        `<item>` +
        `<title>${esc(p.data.title)}</title>` +
        `<link>${url}</link>` +
        `<guid isPermaLink="true">${url}</guid>` +
        `<description>${esc(p.data.description)}</description>` +
        `<pubDate>${p.data.publishedAt.toUTCString()}</pubDate>` +
        `<dc:creator>${esc(p.data.author)}</dc:creator>` +
        p.data.tags.map((t) => `<category>${esc(t)}</category>`).join('') +
        `</item>`
      )
    })
    .join('')

  const self = new URL('/es/blog/rss.xml', site).href
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">` +
    `<channel>` +
    `<title>Blog de Kaddo</title>` +
    `<link>${new URL('/es/blog/', site).href}</link>` +
    `<atom:link href="${self}" rel="self" type="application/rss+xml"/>` +
    `<description>Artículos técnicos sobre Knowledge-Driven Development e ingeniería de software asistida por IA.</description>` +
    `<language>es</language>` +
    items +
    `</channel></rss>`

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
