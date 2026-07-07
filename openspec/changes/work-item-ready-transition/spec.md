# Work Item Review and Ready Transition UX (VS-087)

## Problem

After refining a draft Work Item with the work-item-agent, there was no CLI command to
transition it to `ready`. Users had to manually edit YAML frontmatter and move files between
lifecycle folders.

## Solution

New `kaddo ready <id>` command that:

1. Finds the Work Item by ID.
2. Validates readiness (acceptance criteria, code globs, domains, validation, open questions).
3. Shows a summary and asks for confirmation (skippable with `--yes`).
4. Updates `status: draft` → `status: ready` and adds `ready_at` timestamp.
5. Moves the file from `draft/` to `ready/`, creating the directory if needed.
6. Preserves all metadata and body content.

Also fixes `Artifact.source` field in `artifact-reader.ts` to extract `type` from object-style
source metadata instead of stringifying as `[object Object]`.

## Files changed

- `packages/cli/src/commands/ready.ts` — new command
- `packages/cli/src/index.ts` — command registration
- `packages/cli/src/services/artifact-reader.ts` — fix Artifact.source for object sources
- `packages/cli/tests/ready.test.ts` — 21 tests
- `apps/docs/src/content/docs/commands/ready.md` — EN docs
- `apps/docs/src/content/docs/es/commands/ready.md` — ES docs
- `apps/docs/astro.config.mjs` — sidebar entry

## Acceptance criteria

See VS-087 spec (AC1–AC36).
