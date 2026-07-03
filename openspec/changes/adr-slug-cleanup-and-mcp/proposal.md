# Proposal: ADR Candidate Slug Cleanup and MCP Exposure (VS-075.1)

## Why

VS-075 works, but two frictions remained: (1) suggested ADR filenames duplicated numbering
(`ADR-001-1-…`) because candidate titles kept their `1.` prefix, and (2) tech decisions were only in
`context-pack.json`, so MCP agents had to parse the whole pack instead of querying them directly.

## What

- **Slug cleanup** (`core/decisions.ts`): `cleanCandidateTitle` strips list/heading prefixes
  (`1.`, `2)`, `(3)`, `001.`, `-`, `##`) from candidate titles; `slugify` normalizes acronyms
  (`INTERNAL_CRON_SECRET` → `internal-cron-secret`) and collapses repeats. Candidate titles are stored
  clean and suggested ADR filenames keep the correct sequential `ADR-NNN-` numbering with no
  duplicate `-N-`.
- **MCP resource** (`kaddo://tech-decisions`): read-only resource returning the same object as
  `kaddo adr --json` (status, counts, `candidate_list` with `title`/`source`/`suggestedAdrFile`). CLI
  and MCP share `buildTechDecisions(dir)`, so they never diverge. Deterministic — no writes, no ADR
  creation, no LLM, no git.

## Scope

Slug cleanup + MCP exposure only. No automatic ADR creation, no `kaddo adr create --from candidates`.

## Impact

- `core/decisions.ts` (title cleanup + slug); `mcp/src/resources.ts` (+ `kaddo://tech-decisions`).
  Docs Tech Decisions (EN/ES) + mcp-server resource table; README. Patch bump 3.40.1.
