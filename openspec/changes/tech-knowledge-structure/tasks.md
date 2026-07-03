# Tasks: Tech Knowledge Structure Cleanup (VS-075.2)

- [x] core/decisions.ts: `resolveCandidatesPath` (discovery-first + legacy fallback);
      `buildTechDecisions` returns candidates_source / candidates_legacy_location / candidates_both_exist.
- [x] commands/adr.ts: show source; soft note when both exist; legacy-location hint.
- [x] commands/tech.ts + index.ts + command-help: `kaddo tech organize` — move discovery files into
      `discovery/`, never overwrite, never touch core/decisions, no content change, no git/LLM.
- [x] agents/prompts.ts: architecture-agent outputs discovery artifacts under `discovery/`.
- [x] commands/bootstrap.ts: ensure `knowledge/tech/discovery/`.
- [x] project-explain.ts: `## Tech Knowledge` (core/decisions/discovery) + legacy warning; `techKnowledge`.
- [x] context-pack.ts: `techKnowledge` + Missing Context note for legacy location.
- [x] MCP `kaddo://tech-decisions` works with discovery/ and legacy (uses buildTechDecisions).
- [x] Tests: discovery/legacy/both resolution; tech organize move/no-overwrite/keep-content/keep-core;
      explain Tech Knowledge; bootstrap discovery dir (updated).
- [x] Docs Tech Decisions (EN/ES) structure + organize; README. Minor bump 3.41.0.

## Validation
- [x] typecheck cli+mcp green; `pnpm test` green (724); `pnpm -r build` green; smoke (organize + fallback).
- [x] `astro build` green.
