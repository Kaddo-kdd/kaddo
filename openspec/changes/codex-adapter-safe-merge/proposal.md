# Proposal: Codex Adapter Safe Merge (VS-065.2)

## Why

The Codex adapter can generate a full `AGENTS.md`, but real repos often already have one with the
team's own instructions (code style, test commands, security rules, conventions). `--force` would
delete them, and the default skip leaves no safe path to adopt Kaddo's guidance. Kaddo needs a way to
add its guidance without taking ownership of the whole file.

## What

Add `--inject` to `kaddo adapters install codex` (and the `export codex` alias). It writes a single
delimited block:

```md
<!-- BEGIN KADDO CODEX ADAPTER -->
## Kaddo guidance
…
<!-- END KADDO CODEX ADAPTER -->
```

- Existing external file → append the block, preserving everything else (status: injected).
- File already has the block → update in place, never duplicate (status: updated).
- Missing file → behaves like a normal create (full projection).
- Half-open / invalid markers → fail with a clear message, change nothing.
- `--inject --dry-run` → print the merged result, write nothing.

The block carries the same key guidance as the full projection (knowledge map, operating rules,
command fallback, readiness gate, before/after implementation, guard/impact/savings/drift), but works
as a section inside a larger file. Still references, never inlines full file contents.

## Scope

Only the Codex adapter. No semantic merge, no conflict resolution, no reordering external sections,
no multiple Kaddo blocks, no per-subdir AGENTS.md, no other adapters, no auto-sync.

## Impact

- `core/codex-adapter.ts`: markers, `detectAgentsState`, `renderKaddoBlock`, `injectKaddoBlock`.
- `commands/adapters.ts`: `--inject` mode + messages.
- `index.ts`: register `--inject` on install and export.
- Docs EN/ES (Codex Adapter page) + npm README roadmap. Both packages bump to 3.27.2.
