# Tasks: Knowledge Repository Realignment

Clean cut: no legacy `architecture/` repos, so no migration command and no
backward-compatibility fallback. `knowledge/` is the only layout.

## Phase 1 — Layout + CLI (clean cut)

- [ ] Add `core/layout.ts` (KNOWLEDGE_DIR='knowledge', LAYERS, PATHS).
- [ ] Switch all CLI readers and writers (init, scan, context, understand, create, owners,
      guard, explain, bootstrap, add, modules) to `knowledge/` paths + layer reorg.
- [ ] Reduce bootstrap to minimal artifacts (business + product + tech/codebase.md).
- [ ] `codebase-foundation.md` → `codebase.md`; consolidate stack/standards/git-strategy/
      quality-attributes as sections (still installable via `kaddo add`).
- [ ] `adrs/` → `tech/decisions/`; `modules/` → `tech/modules/`; roadmap + work-items →
      `delivery/`; capabilities/product-brief → `product/`.
- [ ] Re-categorize templates (business/product/tech/delivery/operations/legacy).
- [ ] Update agents' save targets (rename codebase-foundation-agent → codebase-agent).
- [ ] Update all tests/fixtures to the new layout. Keep green.

## Phase 2 — Context / Explain by layer

- [ ] Context pack groups by Business/Product/Tech/Delivery.
- [ ] `kaddo explain` shows per-layer status.
- [ ] Tests for both.

## Phase 3 — Docs & examples (EN/ES)

- [ ] Manifesto macro flow → Business → Product → Tech → Delivery.
- [ ] Homepage "What is Kaddo?", README, visual guide diagram, workflow, use-cases,
      templates pages, agents page.
- [ ] Migrate the four examples to `knowledge/`.

## Validation

- [ ] `pnpm --filter "@kaddo/cli" test`
- [ ] `pnpm -r build`
- [ ] Manual: `kaddo init` → `kaddo bootstrap` → `kaddo explain` on a fresh repo;
      `kaddo migrate knowledge-layout` on a legacy repo.
