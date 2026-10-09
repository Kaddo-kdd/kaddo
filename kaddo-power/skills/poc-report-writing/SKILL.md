---
name: poc-report-writing
description: "Turn a supplied deterministic POC report context into a concise, traceable final report. Use when: After a POC has a canonical conclusion and Core has prepared its deterministic report context."
---

<!-- Generated from packages/cli/src/skills/skills.ts. Run `pnpm agent-plugin:sync`; do not edit directly. -->

# POC Final Report Writing Skill

## Purpose

Turn a supplied deterministic POC report context into a concise, traceable final report.

## When to use

After a POC has a canonical conclusion and Core has prepared its deterministic report context.

## Rules

- Use only the supplied context; do not scan the repository or infer missing results.
- Treat `poc.md` as canonical for the conclusion. Never contradict it.
- Keep facts, measurements, calculations, estimates, and recommendations distinct.
- Never include credential values, tokens, private keys, passwords, or connection strings.
- Use `Not evaluated in this POC.`, `Not applicable.`, or `No evidence available.` when sources do not support a section.
- Return a proposal for human review; Core persists it only after confirmation.

## Representation selection

- Use prose for context, interpretation, rationale, findings, and conclusions.
- Use a Markdown table when supplied evidence has comparable rows, such as success criteria and
  outcomes, resources, experiments, measurements, costs, risks, recommendations, or traceability.
- Use Mermaid only for architecture, topology, or flow relationships explicitly supported by the
  supplied sources. Prefer it to an ASCII diagram when both can represent the same grounded flow.
- Tables and diagrams are communication tools, not completeness requirements. Do not produce one
  when the context does not support a useful representation.
- Never invent table rows, diagram nodes or edges, statuses, priorities, metrics, or relationships
  to make a report look more complete.
- Preserve measured, calculated, estimated, and projected semantics in every representation.
- In Traceability, use repository-relative Markdown links or paths; never emit `file:///` URLs or
  local absolute filesystem paths.

## Section representation guide

| Section | Preferred representation when supported by evidence |
|---|---|
| Executive Summary | Snapshot table and short prose |
| Problem and Objective | Prose |
| Hypothesis and Success Criteria | Evaluation matrix |
| Scope, Constraints and Non-goals | Compact bullets or table |
| Technical Approach and Architecture | Mermaid and prose |
| Infrastructure and Project Resources | Table, with optional Mermaid |
| Implementation and Relevant Technical Decisions | Table or concise prose |
| Experiments and Validation | Validation matrix |
| Results and Measurements | Measurement tables |
| Cost and Efficiency Analysis | Comparison table |
| Observability and Operational Findings | Table or prose |
| Findings, Learnings, Limitations and Risks | Structured matrix |
| Conclusion | Status and concise prose |
| Recommendation and Next Steps | Recommendation matrix only when priority is evidenced |
| Traceability and Sources | Relative-link table or list |

## Quality checklist

- Structured evidence uses tables when clearer than prose.
- Grounded architecture or flows use Mermaid when useful; no decorative or unsupported diagrams exist.
- Tables and Mermaid preserve source grounding and measurement semantics.
- Traceability contains repository-portable paths.
- The report is scannable before reading the full narrative.

## Required structure

1. Executive Summary
2. Problem and Objective
3. Hypothesis and Success Criteria
4. Scope, Constraints and Non-goals
5. Technical Approach and Architecture
6. Infrastructure and Project Resources
7. Implementation and Relevant Technical Decisions
8. Experiments and Validation
9. Results and Measurements
10. Cost and Efficiency Analysis
11. Observability and Operational Findings
12. Findings, Learnings, Limitations and Risks
13. Conclusion
14. Recommendation and Next Steps
15. Traceability and Sources
