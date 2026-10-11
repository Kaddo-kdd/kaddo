# Adding a Visual Explorer concept

The Visual Explorer (Explore Kaddo) is driven by one declarative catalog: `visual-explorer.ts`. Adding a
concept does not require touching the gallery or detail components.

## 1. Add the concept to the catalog

Append a `Concept` entry to `CONCEPTS` in [`visual-explorer.ts`](./visual-explorer.ts). Every text field
is bilingual (`{ en, es }`). Required: `id`, `category`, `title`, `description`, `explanation`,
`purpose`, `example`, `image`, `alt`. Optional: `howToStart`, `references`, `related`.

- `id` is the stable slug (kebab-case). It becomes the fiche URL `/visual-guide/<id>/` (and `/es/...`).
- `category` is one of the editorial categories in `CATEGORIES` (`start`, `manage`, `understand`,
  `integrate`) — these are navigation only, **not** Kaddo knowledge-model categories.
- `references` must point to pages that **actually exist**; `related` ids must exist in the catalog.
- Keep claims verifiable against the current docs. Images are conceptual illustrations, never product
  screenshots or measured metrics.

## 2. Create the two fiche pages

For each concept create a minimal page that renders `<ConceptDetail>`:

- `src/content/docs/visual-guide/<id>.mdx` → `<ConceptDetail id="<id>" lang="en" />`
- `src/content/docs/es/visual-guide/<id>.mdx` → `<ConceptDetail id="<id>" lang="es" />`

Set `title` and `description` in the page frontmatter (for SEO) to match the catalog.

## 3. Add the image

Drop the optimized image at the public path declared in the concept's `image` field, i.e.
`apps/docs/public/visual-explorer/<id>.png`. Until the file exists, the card and fiche show a branded
placeholder automatically — no code change is needed when the image is added.

## 4. Verify

```bash
pnpm --filter @kaddo/docs build
```

The concept then appears in the gallery (filtered by category, searchable) and at its own URL in both
languages.
