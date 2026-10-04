---
title: Writing a blog article
description: How to create and publish a Kaddo blog article — file location, frontmatter schema, drafts, bilingual articles and SEO.
---

The Kaddo blog is an editorial surface separate from this documentation. Articles are Markdown files
versioned in the repository and rendered through Astro routes, independent from the Starlight docs
collection.

## Where articles live

```text
apps/docs/src/content/blog/
├── en/
│   └── my-article.md        → /blog/my-article/
└── es/
    └── my-article.md        → /es/blog/my-article/
```

The locale is the subfolder (`en/` or `es/`). An English and a Spanish file **with the same name**
share one slug, which lets Kaddo generate the correct `hreflang` relation between them. A language
can exist on its own — an English article does not require a Spanish translation to be published.

## Frontmatter

```yaml
---
title: What is Knowledge-Driven Development?
description: One-sentence summary used for the meta description and card.
publishedAt: 2026-10-04
updatedAt: 2026-10-10        # optional
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - ai-assisted-development
locale: en                   # en | es (must match the subfolder)
cover: /banner.png           # optional; site-relative path or absolute URL
draft: false                 # optional; true hides it from production
featured: false              # optional; true highlights it on the index
---
```

`title`, `description` and `publishedAt` are required. Dates are written as `YYYY-MM-DD` and rendered
in UTC.

## Drafts

An article with `draft: true` is visible while developing locally (`pnpm -C apps/docs dev`) but is
excluded from the production build: no route, no index entry, no tag page, no RSS item, no sitemap
entry. Use it to prepare content before publishing.

## Tags and internal links

Tags produce navigable pages under `/blog/tags/<tag>/`. Link naturally from an article to the
documentation using canonical paths, e.g. `[Getting started](/getting-started/)`. The blog explains
the problem and concept; the docs explain how Kaddo solves it.

## What you get automatically

Each published article generates its `<title>`, meta description, canonical URL on `kaddo.org`,
Open Graph and Twitter Card metadata, `BlogPosting` JSON-LD, and entries in the sitemap and the RSS
feed (`/blog/rss.xml`, `/es/blog/rss.xml`). Related articles are derived deterministically from
shared tags.

## Verify

```bash
pnpm -C apps/docs build
```

Then confirm `/blog/`, `/blog/<slug>/` and `/es/blog/` build, and that any `draft: true` article is
not generated.
