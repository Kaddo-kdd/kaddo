# Proposal: Capability-Grounded Roadmap Generation (VS-077)

## Why

Roadmap candidates were being written as free-floating ideas with no traceable link to what Kaddo
already knows about the system. A priority that can't be traced back to a capability domain, a related
capability and a source signal (capability gap, open question, drift, decision candidate) is just an
opinion. Grounding makes the roadmap auditable: every candidate has a reason that lives inside the
system's own knowledge.

## What

Grade how well each roadmap candidate is grounded and surface it — without blocking the roadmap.

- `core/roadmap-quality.ts` (new): `parseRoadmapCandidateQuality` parses `### RM-xxx` candidates
  (format-tolerant: `- Key:` and `**Key:**`, inline value or indented sub-bullets) into
  `RoadmapCandidateQuality` (hasRelatedDomain / hasRelatedCapability / hasSourceSignals / grounded);
  `buildRoadmapQuality(dir)` returns counts (`candidates`, `grounded`, per-field) + `needs_refinement`.
- `project-explain.ts`: `roadmapQuality` on `ProjectExplanation`; `## Roadmap Quality` section rendered
  when candidates exist.
- `context-pack.ts` + template: `roadmapQuality` carried into the pack and rendered as `## Roadmap
  Quality`.
- `understand`: nudge — refine via roadmap-agent when `needs_refinement`, else suggest
  `kaddo create --from roadmap`.
- `create.ts`: `buildRoadmapFrontMatter` preserves `source_roadmap_candidate`, `related_domain`,
  `related_capability` + `related_capabilities`, `expected_value`, `risks`, `dependencies` — only when
  the candidate carried them (never invents values).
- `agents/prompts.ts`: roadmap-agent output rewritten to grounded fields (Related domain / capabilities
  / Source signals / Expected value / Risks / Dependencies / Suggested Work Items / Not now) + grounding
  rules; explicitly never materializes Work Items (`knowledge/delivery/work-items/`); work-item-agent
  preserves roadmap metadata.
- MCP `kaddo://roadmap-quality` (read-only) sharing `buildRoadmapQuality`.

Grounding is quality guidance, not a hard gate. No LLM from the CLI, no auto-created Work Items, no git,
no invented domains/capabilities. Roadmap is never blocked.

## Impact

- New `core/roadmap-quality.ts`; edits to `core/project-explain.ts`, `core/context-pack.ts`,
  `templates/context-pack-template.ts`, `commands/understand.ts`, `commands/create.ts`,
  `agents/prompts.ts`; MCP `resources.ts`. Docs Roadmap Quality (EN/ES) + sidebar; README. Minor bump
  3.43.0.
