# Proposal: Tech Knowledge Structure Cleanup (VS-075.2)

> Numbered VS-075.1 by the spec author, but that number is taken (ADR slug cleanup + MCP, v3.40.1).
> Registered as VS-075.2.

## Why

`knowledge/tech/` was becoming a flat folder mixing artifacts of different maturity: core (current-
state, codebase), formal decisions (`decisions/`) and discovery inputs (architecture-notes,
decision-candidates). It's unclear which file is a primary source vs a temporary input. Separating
them keeps the tech layer clean and scalable, and prepares ADR/Work-Item traceability.

## What

Introduce `knowledge/tech/discovery/` for discovery artifacts, with backward-compatible fallback to
the legacy root:

- `core/decisions.ts`: `resolveCandidatesPath` reads `knowledge/tech/discovery/decision-candidates.md`
  first, falls back to the legacy root; `buildTechDecisions` returns `candidates_source`,
  `candidates_legacy_location`, `candidates_both_exist`. Suggested ADR filenames unchanged.
- `kaddo adr`: shows the source used; soft note when both files exist; hint when the legacy location is
  used.
- `kaddo tech organize`: deterministic migration — moves `architecture-notes.md` /
  `decision-candidates.md` from the root into `discovery/` without changing content, never overwrites,
  never touches `current-state.md` / `codebase.md` / `decisions/`, no LLM, no git.
- `architecture-agent` prompt: outputs discovery artifacts under `discovery/` (legacy still read).
- `bootstrap`: ensures `knowledge/tech/discovery/`.
- `explain`: `## Tech Knowledge` section (Core / Decisions / Discovery) + legacy-location warning.
  `context-pack`: `techKnowledge` (core/decisions/discovery) + a Missing Context note for legacy
  location.
- MCP `kaddo://tech-decisions` works with both locations (it uses `buildTechDecisions`).

The Tech layer's maturity still depends on `current-state.md` + `codebase.md` — discovery files are
not required to mark Tech Structured. Backward compatible; nothing is deleted.

## Impact

- `core/decisions.ts`, `commands/adr.ts`, new `commands/tech.ts`, `commands/bootstrap.ts`,
  `core/project-explain.ts`, `core/context-pack.ts`, `agents/prompts.ts` (architecture-agent),
  `index.ts` + command-help. Docs Tech Decisions (EN/ES); README. Minor bump 3.41.0.
