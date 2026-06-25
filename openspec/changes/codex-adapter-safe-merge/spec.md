# Spec: Codex Adapter Safe Merge (VS-065.2)

## States (detectAgentsState)
- `missing`, `existing_external`, `generated_by_kaddo`, `existing_with_kaddo_block`,
  `invalid_kaddo_block` (one marker without its pair).

## `--inject` behavior
- Block delimited by `<!-- BEGIN KADDO CODEX ADAPTER -->` / `<!-- END KADDO CODEX ADAPTER -->`.
- Existing external file → append block, preserve content before and after (status injected).
- File with block → replace only the block region, no duplication (status updated).
- Missing file → write the full projection (create).
- `--inject --dry-run` → print merged result, write nothing.
- Invalid/half-open markers → error message, exit non-zero, file untouched.
- Block includes: Kaddo guidance, knowledge map (`.kaddo/` marked generated), operating rules,
  command fallback (corepack pnpm exec / pnpm exec / npx), readiness gate before roadmap, read Work
  Item before implementation, after-implementation guard/impact/savings/drift.

## Constraints
- Default (no flag) still skips an existing file; `--force` still overwrites the whole file.
- Deterministic: no LLM, no git, no knowledge/`.kaddo/` writes, no full-file inlining.

## Validation
- `pnpm test` green; typecheck green; both packages build; docs build.
- Tests: block content & markers; state classification; inject append + preserve; update without
  duplication; invalid block throws; command inject/update/dry-run/invalid/no-knowledge-write.
