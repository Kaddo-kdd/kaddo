# Proposal: Claude Adapter Safe Merge + Neutral Markers (VS-066 follow-up)

## Why

VS-066 shipped the Claude Code adapter but left `--inject` Codex-only. A `CLAUDE.md` with team-owned
instructions is at least as common as an `AGENTS.md`, so Claude should support the same safe merge.
The existing block markers (`KADDO CODEX ADAPTER`) also read oddly inside a `CLAUDE.md`.

## What

- Enable `--inject` for `kaddo adapters install claude` (and the `export claude` alias), reusing the
  existing `injectKaddoBlock` / `renderKaddoBlock` safe-merge machinery: add or update a single
  delimited block, preserve everything outside it, update in place (no duplication), error on
  half-open markers, support `--inject --dry-run`.
- Make the block markers **target-neutral**: `<!-- BEGIN KADDO ADAPTER -->` / `<!-- END KADDO
  ADAPTER -->`. The legacy `KADDO CODEX ADAPTER` markers are still recognized and **auto-migrated**
  to the neutral form on the next inject/update.
- Fix the inject "no file yet" branch to render the correct target (was hardcoded to Codex).

## Scope

Codex + Claude adapters only. No new adapters. No behavior change to create/force/dry-run beyond the
neutral markers.

## Impact

- `core/codex-adapter.ts`: neutral markers + legacy recognition (`findMarker`/`markerLength`);
  `detectAgentsState`/`injectKaddoBlock` accept both; generated-by detection by prefix (codex/claude).
- `commands/adapters.ts`: `supportsInject: true` for claude; inject create-branch uses the target
  renderer.
- Docs EN/ES (Codex marker note + Claude safe-merge section) + npm README. Patch bump to 3.28.1.
