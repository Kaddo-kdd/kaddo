import { defineCollection, z } from 'astro:content'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { glob } from 'astro/loaders'

// Blog collection (WI-023). Independent from the Starlight `docs` collection — editorial content
// versioned in the repo, rendered through Astro routes with a Kaddo-branded layout. Bilingual:
// an EN article is `<slug>.md` (locale: en); its optional ES counterpart is `<slug>.es.md`
// (locale: es), sharing the same base slug so hreflang can relate them.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    author: z.string().default('Julian Dario Luna Patiño'),
    tags: z.array(z.string()).default([]),
    locale: z.enum(['en', 'es']).default('en'),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
})

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  blog,
}
