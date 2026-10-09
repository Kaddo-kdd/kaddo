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
