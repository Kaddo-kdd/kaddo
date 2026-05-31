---
type: current-state
updated_at: 2026-05-31
---

# Kaddo — Knowledge

## Purpose

Kaddo is an open source CLI toolkit for preserving and evolving product knowledge close to the code. It helps teams keep minimum sufficient context alive without turning development into bureaucracy.

**Central question:** *How does Kaddo know the right knowledge was impacted by this change?*

## Architecture overview

Kaddo is a TypeScript CLI (Node.js 18+) distributed via npm/npx. It is structured as a pnpm monorepo with a single package (`packages/cli`) for now.

```
packages/cli/src/
  commands/     — one file per CLI command (init, scan, create, guard)
  core/         — pure logic with no I/O (knowledge-levels, diff-analysis)
  services/     — I/O operations (git, filesystem, artifact parsing)
  utils/        — shared helpers (fs, ui/clack)
```

## Key design decisions

- **Deterministic before AI** — if filesystem or git can answer it, no LLM is used
- **Ownership in front matter** — each artifact declares what code it protects via `code:` globs; no central mapping file
- **Non-blocking guard** — Guard Lite informs, never blocks
- **Silent without ownership** — if no artifacts declare `code:` globs, guard stays silent
- **Minimum sufficient knowledge** — ask for answers, not documentation

## Current state (v1.0)

Four commands are implemented and working:
- `kaddo init` — creates `.kaddo/config.yml` and `architecture/` structure
- `kaddo scan` — deterministic stack detection
- `kaddo create [type]` — Work Items with minimum K-level questions
- `kaddo guard` — Guard Lite: git diff vs declared code globs

61 unit tests. All passing.

## Active constraints

- Core must remain small — modules are opt-in via `kaddo add [module]`
- No mandatory LLM integration in Core
- No blocking behavior by default
- Token efficiency: full documents are loaded only when metadata and summaries are insufficient
- Windows/Linux path compatibility required (paths normalized with `path.posix`)
