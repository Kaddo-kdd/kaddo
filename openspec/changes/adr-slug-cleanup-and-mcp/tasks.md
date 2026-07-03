# Tasks: ADR Candidate Slug Cleanup and MCP Exposure (VS-075.1)

- [x] core/decisions.ts: `cleanCandidateTitle` (strip `1.`/`2)`/`(3)`/`001.`/`-`/`##`); parser stores
      clean titles; `slugify` normalizes acronyms + collapses hyphens; suggested ADR filenames keep
      sequential numbering with no duplicate `-N-`.
- [x] mcp/src/resources.ts: read-only `kaddo://tech-decisions` returning `buildTechDecisions(root)`
      (status, counts, candidate_list). Shares source with `kaddo adr --json`.
- [x] Tests: CLI slug cleanup (prefixes + acronyms + no duplicate numbering); MCP resource URI list +
      tech-decisions read (status/candidate_list/clean suggestedAdrFile, read-only).
- [x] Docs Tech Decisions (EN/ES) MCP + clean-filenames sections; mcp-server resource table (EN/ES);
      README. Patch bump 3.40.1.

## Validation
- [x] typecheck cli+mcp green; `pnpm test` green (719); `pnpm -r build` green; smoke (clean slugs).
- [x] `astro build` green.
