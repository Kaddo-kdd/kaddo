# Spec: Knowledge Repository Realignment

## User Story

As a Kaddo user, I want the project's knowledge organized as Business → Product → Tech →
Delivery under `knowledge/`, so the structure matches what Kaddo actually manages, not just
architecture.

## Acceptance Criteria

- **AC1** — `knowledge/` is the official knowledge repository root.
- **AC2** — The four layers are Business, Product, Tech, Delivery, reflected in the
  manifesto, docs and examples.
- **AC3** — `kaddo bootstrap` generates only the minimal artifacts (business + product +
  `tech/codebase.md`); not roadmap, work-items or decisions.
- **AC4** — `codebase.md` replaces `codebase-foundation.md`.
- **AC5** — `decisions/` replaces `adrs/`.
- **AC6** — Roadmap and Work Items live under `knowledge/delivery/`.
- **AC7** — All examples use the new structure.
- **AC8** — Homepage, README and site docs reflect the new taxonomy.
- **AC9** — Context and Explain group knowledge by layer.
- **AC10** — Build, tests and examples keep working.
- **AC11** — Clean cut: `knowledge/` is the only layout. No legacy `architecture/` repos
  exist, so no migration command or backward-compatibility fallback is required.
- **AC13** — Guard's matching algorithm is unchanged (paths only).

## Edge Cases

- Repo already on `knowledge/` → migrate is a no-op (idempotent).
- Both `architecture/` and `knowledge/` exist → migrate skips conflicts, reports them.
- Consolidated files (stack/standards/git-strategy/quality-attributes) → migrate reports
  them as "needs manual merge into tech/codebase.md" rather than guessing.
- No knowledge at all → commands behave as on a fresh project.

## Example `explain` output

```
Business
  ✓ problem
  ✓ users
Product
  ✓ product brief
  ✓ capabilities
Tech
  ✓ codebase
Delivery
  ✗ roadmap
  ✗ work items
```

## Validation

```bash
pnpm --filter "@kaddo/cli" test
pnpm -r build
```
