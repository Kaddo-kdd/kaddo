---
title: Legacy templates
description: Risks, unknowns and modernization candidates.
---

For working safely with legacy systems. Refine with the `legacy-agent`.

| Template | Purpose | Output path | Agent |
|---|---|---|---|
| Legacy Risks | High-risk areas before changing code | `knowledge/legacy/risks.md` | `legacy-agent` |
| Legacy Unknowns | What is not yet understood | `knowledge/legacy/unknowns.md` | `legacy-agent` |
| Modernization Candidates | Candidate modernization efforts | `knowledge/legacy/modernization-candidates.md` | — |

## Legacy Risks

`RISK-001` entries: what, why risky, blast radius, mitigation. Surface these **before**
modifying legacy code.

## Legacy Unknowns

`UNK-001` entries: question, why it matters, how to find out. Unknowns are never
silently turned into assumptions.

## Modernization Candidates

`MOD-001` entries: current state, target state, value, risk and a suggested knowledge
level — candidates for human review, not commitments.
