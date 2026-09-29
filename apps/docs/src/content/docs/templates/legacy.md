---
title: Legacy templates
description: Risks, unknowns and modernization candidates — structured for lifecycle traceability.
---

For working safely with legacy systems. Refine with the `legacy-agent`. Each finding uses
a stable identifier (RISK-xxx, UNK-xxx, MOD-xxx) that downstream agents — `roadmap-agent`,
`work-item-agent`, `implementation-agent` — can reference throughout the Kaddo lifecycle.

| Template | Purpose | Output path | Agent |
|---|---|---|---|
| Legacy Risks | High-risk areas before changing code | `knowledge/legacy/risks.md` | `legacy-agent` |
| Legacy Unknowns | What is not yet understood | `knowledge/legacy/unknowns.md` | `legacy-agent` |
| Modernization Candidates | Candidate modernization efforts | `knowledge/legacy/modernization-candidates.md` | `legacy-agent` |

## Legacy Risks

`RISK-001` entries: area, why risky, blast radius (local / module / cross-cutting /
system-wide), confidence (high / medium / low), scan signals, graph entities, mitigation.

These risks are:
- **Referenced by `roadmap-agent`** when prioritizing initiatives for legacy projects.
- **Referenced by `work-item-agent`** during refinement (`legacy_risks:` front matter).
- **Included in Implementation Handoff** for areas being modified.
- **Detected by `kaddo guard`** when touched files intersect risk areas.
- **Available via MCP** as `kaddo://legacy-risks`.

## Legacy Unknowns

`UNK-001` entries: question, why it matters, how to find out, related risks, blocking
status. Unknowns are never silently turned into assumptions.

Available via MCP as `kaddo://legacy-unknowns`.

## Modernization Candidates

`MOD-001` entries: current state, target state, value, risk, suggested knowledge level,
related risks and unknowns, affected system entities — candidates for human review, not
commitments.

Available via MCP as `kaddo://modernization-candidates`.

## Legacy-aware lifecycle

The `legacy-risk-assessment` skill evaluates a planned change against these findings.
See [Legacy project](/use-cases/legacy-project/) for the complete workflow.
