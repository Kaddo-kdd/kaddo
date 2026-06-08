# Spec: Delivery Context Consistency & Ownership Guidance

## Context pack
- Handoff (recommendedAgents + nextStep) and LLM instructions come from the real phase, not
  project.state. LLM instructions vary by phase (Planning / Delivery Preparation / Active Delivery
  draft|ready|in-progress|blocked / Maintenance).

## Owners suggest
- `normalizeGlob`, `analyzeGlob` (broad-glob warning, path validation + did-you-mean).
- ownership-agent proposes precise globs; owners suggest is the manual/override tool.

## Guard
- Non-blocking warning listing untracked files.

## ADR path
- adr/architecture agents: final ADRs under knowledge/tech/decisions/, never knowledge/tech/.

## Duplicate Work Items
- explain warns on same source_id or same normalized title.

## Out of scope
- Auto-apply ownership, auto-fix paths, auto-commit/branch, roadmap sync, MCP, portal.

## Acceptance criteria
- AC1 no contradictory recommendations. AC2 phase-based recommendations. AC3 phase-based LLM
  instructions. AC4 glob normalization. AC5 path-not-found warning. AC6 broad-glob warning.
- AC7 ownership-agent exists. AC8 guard warns untracked. AC9 ADRs under tech/decisions/.
- AC10 duplicate Work Item warning. AC11 context/explain/understand share phase logic.
- AC12 docs EN/ES. AC13 tests cover the above.
