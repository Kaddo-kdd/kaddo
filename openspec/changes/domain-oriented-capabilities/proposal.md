# Proposal: Domain-Oriented Capability Inventory (VS-074.1)

## Why

VS-074 made the capability-agent discover existing capabilities with evidence, but the result could
still be a flat list. A flat list doesn't show the system's functional structure (which domains
exist, which capabilities live in each, what code backs them, which gaps belong where). Grouping
capabilities by **functional domain** makes roadmaps and Work Items trace to the real functional map.

## What

- **bootstrap templates** (pre-ai/legacy `capabilities.md`): restructured to `## Capability Domains`
  → `### Domain: <name>` (Purpose + Evidence summary; legacy adds Criticality / Change risk /
  Operational dependency) → `#### Capability: <name>` (status + evidence + flows/data/…); gaps and
  candidate signals now name their `Domain` and `Related capability`.
- **capability-agent prompt**: pre-ai/legacy mode is a *Domain-Oriented Capability Inventory* — group
  by functional responsibility, never by technical folder; a capability may span layers; keeps the
  VS-074 evidence rule; every gap/candidate names Domain + Related capability.
- **roadmap-agent prompt**: reads `capabilities.md` as a map of functional domains; candidates
  reference `Domain` + `Related capability` + `Based on`.
- **work-item-agent prompt**: recommends `related_domain` in addition to `related_capability`.
- **next-step**: discovery wording mentions "grouped by functional domains".
- **artifact-quality**: recognizes domain-template scaffolding (`<Domain name>`, bold field labels,
  enum options) so a fresh domain template still classifies as `placeholder`.

Deterministic: `kaddo scan` unchanged, no functional interpretation in the CLI, no LLM/git, no
invented domains/paths/tables/functions.

## Impact

- `core/bootstrap-templates.ts`, `agents/prompts.ts` (capability/roadmap/work-item), `core/next-step.ts`,
  `core/artifact-quality.ts`. Docs bootstrap (EN/ES); README. Patch bump 3.39.1.
