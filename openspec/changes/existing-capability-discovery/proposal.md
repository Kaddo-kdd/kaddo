# Proposal: Existing Capability Discovery for Pre-AI and Legacy (VS-074)

## Why

For pre-ai/legacy projects, `capabilities.md` must be a structured inventory of what the system
already does (evidence, status, gaps) — not a shallow feature list. Otherwise the roadmap is built on
incomplete interpretation. Kaddo should understand the current functional scope before projecting the
future.

## What

Make the capability-agent state-aware and enrich the `capabilities.md` templates:

- **capability-agent prompt**: three modes by `project.state` — new = Planned Capability Definition;
  pre-ai = Existing Capability Discovery; legacy = Legacy Capability Discovery. Adds capability status
  values (`implemented`/`partial`/`inferred`/`risky`/`deprecated`/`unknown`), an evidence rule (never
  `implemented` without evidence; `inferred`/`unknown` otherwise; never invent evidence), a richer
  pre-ai/legacy output format (Capability Inventory + Capability Gaps + Roadmap Candidate Signals; +
  criticality/change-risk/operational-dependency/modernization for legacy).
- **bootstrap templates**: pre-ai/legacy `capabilities.md` scaffolds the evidence-backed inventory,
  gaps and roadmap candidate signals (legacy adds the risk/modernization fields).
- **roadmap-agent prompt**: treats `capabilities.md` as the primary source for roadmap candidates
  (partial capabilities, gaps, candidate signals, risky capabilities), and won't build from a
  placeholder.
- **work-item-agent prompt**: recommends `related_capability` for traceability (future).
- **next-step**: for pre-ai/legacy with placeholder capabilities, the recommendation uses discovery
  wording ("discover and document existing system capabilities").

Deterministic: no CLI functional interpretation, `kaddo scan` unchanged, no agent execution, no LLM
from the CLI, no invented evidence.

## Impact

- `agents/prompts.ts` (capability/roadmap/work-item agents); `core/bootstrap-templates.ts`
  (capabilities pre-ai/legacy); `core/next-step.ts` (discovery wording); `core/artifact-quality.ts`
  (recognize inventory scaffolding as placeholder). Docs bootstrap (EN/ES); README. Minor bump 3.39.0.
