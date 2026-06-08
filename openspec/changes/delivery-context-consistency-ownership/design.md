# Design: Delivery Context Consistency & Ownership Guidance

## Phase-driven context (AC1–AC3, AC11)
- `assessPhase` gains `llmInstructions` per phase/sub-state.
- context-pack handoff uses `phase.recommendedAgents` / `[phase.nextStep]` / `phase.llmInstructions`
  (fallback to legacy state helpers only when empty). Template renders "Recommended next for the
  <phase> phase" instead of "for a <state> project".

## Owners suggest (AC4–AC6)
- `ownership-suggest.ts`: `normalizeGlob` and `analyzeGlob` (Levenshtein-based did-you-mean, broad
  glob regex). Wired into the interactive manual-entry loop.

## ownership-agent (AC7)
- New prompt (9-section) + responsibility matrix entry + delivery group + recommended sets.

## Guard untracked (AC8)
- `git.ts: getUntrackedFiles()` (read-only `git ls-files --others --exclude-standard`); guard prints
  a non-blocking FYI (human mode), never in JSON/CI.

## ADR path (AC9)
- adr-agent / architecture-agent prompts: final ADRs under knowledge/tech/decisions/.

## Duplicate Work Items (AC10)
- `findDuplicateWorkItems` (same source_id or NFD-normalized title); explain renders a section.

## Compatibility
Additive. JSON guard output unchanged. Legacy state helpers kept as fallback.
