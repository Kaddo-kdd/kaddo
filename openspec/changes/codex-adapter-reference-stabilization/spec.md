# Spec: Codex Adapter Reference Stabilization (VS-065.1-ref)

## Package manager detection
- `detectPackageManager(dir)`: `pnpm-lock.yaml`→pnpm, `yarn.lock`→yarn, `bun.lock(b)`→bun,
  `package-lock.json`→npm; undefined when none.

## Command fallback section
- Always prefers global `kaddo <command>`.
- Local runners tailored to the detected manager:
  - pnpm: `corepack pnpm exec` / `pnpm exec` / `npx`
  - npm: `npm exec` / `npx`
  - yarn: `yarn` / `yarn dlx` / `npx`
  - bun: `bunx` / `npx`
  - none: generic (corepack pnpm exec / pnpm exec / npm exec / npx)
- States the agent must not report Kaddo unavailable / fail immediately before trying a local runner.
- Same renderer used by the full `AGENTS.md` and the injected Kaddo block.
- Still no full-file inlining; no LLM/git; no writes outside `AGENTS.md`; no overwrite without
  `--force`; `--dry-run` writes nothing.

## Docs
- Codex page: documented as reference adapter; package-manager note; manual smoke tests (read-only,
  readiness-before-roadmap, implementation, no-`.kaddo/`-edit).
- New Custom Adapters page (EN/ES): Adapter Contract, common-core/target-renderer split, include /
  not-include lists, base template, smoke tests. Sidebar entry.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests: pm detection (pnpm/npm/yarn/none) → correct fallbacks; "don't fail immediately" line; no
  writes outside AGENTS.md; no overwrite without --force; --dry-run/--force.
