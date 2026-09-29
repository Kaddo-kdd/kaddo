---
name: legacy-risk-assessment
description: "Evaluate a planned change against known legacy risks, unknowns and modernization candidates to identify which findings require additional consideration before or after implementation. Use when: Before or during implementation of a Work Item in a legacy project — especially when the Work Item touches areas flagged in `knowledge/legacy/risks.md`."
---

<!-- Generated from packages/cli/src/skills/skills.ts. Run `pnpm agent-plugin:sync`; do not edit directly. -->

# Legacy Risk Assessment Skill

## Purpose

Evaluate a planned change against known legacy risks, unknowns and modernization candidates
to identify which findings require additional consideration before or after implementation.

## When to use

Before or during implementation of a Work Item in a legacy project — especially when the
Work Item touches areas flagged in `knowledge/legacy/risks.md`.

## Inputs

- The Work Item (id, ACs, affected_modules, affected areas).
- `knowledge/legacy/risks.md` — known risks with RISK-xxx identifiers.
- `knowledge/legacy/unknowns.md` — known unknowns with UNK-xxx identifiers.
- `knowledge/legacy/modernization-candidates.md` — MOD-xxx candidates.
- System Graph (`.kaddo/graph.json`) when available.
- Implementation Handoff or Implementation Evidence when available.

## Output

A risk assessment report listing which legacy findings are relevant to the planned change,
their intersection with the affected areas, and recommended actions.

### Output template

```markdown
# Legacy Risk Assessment — <WI id>

## Relevant Risks

### RISK-xxx: <title>
- **Intersection:** <how this risk relates to the planned change>
- **Action:** mitigate before | monitor during | verify after | not applicable
- **Notes:** <additional context>

## Relevant Unknowns

### UNK-xxx: <question>
- **Impact on this WI:** <how this unknown affects implementation>
- **Recommended:** investigate before | accept as assumption | defer

## Relevant Modernization Candidates

### MOD-xxx: <title>
- **Alignment:** <how this WI relates to the modernization target>
- **Recommendation:** advance | defer | not relevant

## Summary

- Risks requiring pre-implementation mitigation: <count>
- Unknowns requiring investigation: <count>
- Modernization candidates advanced by this WI: <count>
- Overall risk posture: low | medium | high
```

## Rules

- Reference findings by their stable identifiers — do not copy full content.
- Assess intersection based on affected areas (file paths, modules, system entities).
- Not every legacy finding is relevant — filter to those that intersect the change.
- Do not block implementation solely because legacy risks exist — provide context for
  informed decision-making.
- When the System Graph is available, use entity relationships to discover indirect risk
  intersections.

## Quality checklist

- Every referenced finding uses its stable identifier (RISK-xxx, UNK-xxx, MOD-xxx).
- Each relevant finding has an explicit action recommendation.
- Findings not relevant to the change are excluded, not listed as "not applicable".
- Overall risk posture is stated.
- The assessment is proportional — a small change gets a brief assessment.
