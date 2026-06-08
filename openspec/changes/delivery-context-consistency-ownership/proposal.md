# Proposal: Delivery Context Consistency & Ownership Guidance (VS-052)

## Why

Validating `todoApp` in Active Delivery, the context pack mixed a state-aware top block with a
legacy `project.state`-based handoff ("Recommended agents for a new project: roadmap-agent,
architecture-agent"), contradicting itself. Ownership entry was unassisted, Guard ignored
untracked files, ADR paths drifted, and duplicate Work Items could appear after roadmap
regeneration/translation.

## What

Align `context`, `explain`, `understand`, `owners suggest` and `guard` around the real phase, and
make ownership guidance assisted.

- context: the Recommended Agent Handoff + LLM instructions are phase-based (no contradiction);
  per-phase LLM instructions.
- owners suggest: glob normalization (`src/cli` → `src/cli/**`), path validation with did-you-mean,
  broad-glob warnings.
- new `ownership-agent` proposing precise `code:` globs (human applies).
- guard: non-blocking warning when untracked files exist.
- ADR path: agents always create final ADRs under `knowledge/tech/decisions/`.
- explain: warns about possible duplicate Work Items (same source candidate / normalized title).
- explain/context/understand share the same phase + assessment logic.

## Impact

Kaddo stops mixing initial recommendations with operational ones and guides by real state. Out of
scope: auto-apply ownership, auto-fix paths, auto-commit/branch, roadmap sync, MCP, portal.
