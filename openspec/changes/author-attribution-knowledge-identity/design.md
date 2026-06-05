# Design: Author Attribution & Knowledge Identity

- New pages: `apps/docs/src/content/docs/{about,knowledge-driven-development}.md` (+ es/).
- Sidebar (Start here): add "Knowledge Driven Development" and "About" (EN/ES).
- Homepage (`index.mdx` EN/ES): discreet "Created by Julian Dario Luna Patiño" → /about.
- Footer: override Starlight `Footer` component (`src/components/Footer.astro`) to append the
  attribution on every page.
- Manifesto (EN/ES): final "Origin" section (motivation, context, relation to KDD, goal).
- Introduction: one line clarifying KDD ≠ Kaddo (Kaddo = practical implementation for AI era).
- README: "About the Author" + "Why Kaddo Exists".
- SEO via astro.config `head`: `<meta name="author">`, `<meta property="og:..." creator>` and
  a JSON-LD `Person` (name, jobTitle, worksFor TryCatch.tv, sameAs GitHub).

## Correctness guardrail
Copy states the author **created Kaddo**, an implementation of **KDD principles** — KDD is a
prior concept the project does not claim to have invented.
