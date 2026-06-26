# Proposal: Codex Adapter Reference Stabilization (VS-065.1-ref)

> Numbered VS-065.1 by the spec author, but distinct from the earlier "command fallbacks" change.
> Stabilizes the Codex adapter as the reference implementation for future Kaddo adapters.

## Why

The Codex adapter works, but before building adapters for other tools (Claude Code, OpenCode,
Antigravity) it needs to be a solid reference: robust command fallbacks that respect the project's
package manager, and documentation of the shared **Adapter Contract** so future adapters stay
consistent and don't duplicate the base rules.

## What

- **Package-manager-aware fallbacks**: detect the manager from lockfiles (`pnpm-lock.yaml` → pnpm,
  `package-lock.json` → npm, `yarn.lock` → yarn, `bun.lock(b)` → bun) and tailor the suggested local
  runners (corepack pnpm exec / pnpm exec for pnpm; npm exec / npx for npm; yarn / yarn dlx for yarn;
  bunx for bun; generic list when none detected). The global `kaddo` is always preferred; the section
  tells the agent not to fail just because the global binary is missing.
- **Shared fallback renderer** used by both the full projection and the injected block.
- **Docs**: Codex documented as the reference adapter with manual smoke tests; a new **Custom
  Adapters** page (EN/ES) describing the Adapter Contract, the common-core / target-renderer split,
  what to include / not include, a base template, and smoke tests.

## Scope

Codex adapter + adapter docs only. No new commands. No other adapters, no auto-execution, no
runtime package install, no knowledge/`.kaddo/` writes.

## Impact

- `core/codex-adapter.ts`: `packageManager` in context, `detectPackageManager`, `commandFallbacks`,
  `commandFallbackSection`; both renderers use it.
- Docs EN/ES: Codex page (reference + pm note + smoke tests), new Custom Adapters page + sidebar.
- npm README roadmap. Both packages bump to 3.27.3.
