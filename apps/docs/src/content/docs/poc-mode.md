---
title: Proof of Concept mode
description: Run a focused, evidence-led experiment without adopting the full product lifecycle.
---

Project mode is separate from project state. State describes the repository (`new`, `pre-ai`, or
`legacy`); mode describes how Kaddo should guide the work.

Use `poc` when the immediate goal is to validate an assumption, not to plan a complete product
roadmap.

```bash
kaddo init --mode poc
# or, for an existing project
kaddo project mode poc
kaddo add agents
kaddo add skills
```

Existing projects remain in `standard` mode when `project.mode` is absent.

## POC route

```mermaid
flowchart LR
  A[Enable Kaddo] --> B[Hypothesis]
  B --> C[Success criteria]
  C --> D[Minimal technical context]
  D --> E[Resources]
  E --> F[Experiment Work Item]
  F --> G[Evidence]
  G --> H[Conclusion]
  H --> I["Final report (optional)"]
```

The canonical artifact is `knowledge/delivery/poc.md`. It records:

- Problem
- Hypothesis
- Expected Value
- Scenario
- Success Criteria
- Constraints
- Non-goals
- Evidence
- Conclusion: `validated`, `rejected`, or `inconclusive`

POC mode is ready after initialization: define the hypothesis and success criteria in `poc.md`,
then create a `spike` when the experiment is clear. It does not require the standard
Business/Product baseline, a roadmap, or a complete capability map. Add technical context and
Project Resources only when the experiment needs them.

Install agents and skills during the initial POC setup. They provide the guided refinement and
implementation context without creating a standard Business/Product baseline.

Run `kaddo understand`, `kaddo context`, or inspect `kaddo://poc` through MCP to see the current
POC status and the next recommended step.

## Final POC report

`poc.md` remains the working and canonical experiment artifact. A final report is an optional,
immutable communication snapshot created only after the conclusion is `validated`, `rejected`, or
`inconclusive`. It never blocks POC completion or changes the canonical conclusion.

```bash
kaddo poc report
```

The command prepares deterministic, source-attributed context; it does not call an LLM or write a
report. An agent synthesizes a proposal from that context, a human reviews it, and Core persists a
confirmed report next to `poc.md` as `poc-report-v001.md`, then `poc-report-v002.md`, and so on.
Earlier versions are never overwritten.

Kaddo records a fingerprint of the exact selected sources. The report is `missing`, `current`, or
`stale`; new evidence makes it stale but never regenerates it automatically. Regeneration creates
the next version only after an explicit confirmation. The context includes `poc.md` and only
directly traceable experiment Work Items, evidence, referenced Resources, Tech knowledge, and
decisions. It excludes credential values, tokens, private keys, passwords, and connection strings.

The report uses this canonical structure:

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

### Evidence-driven representation

Choose the form that communicates the supplied evidence most clearly. Tables and diagrams are
communication tools, not completeness requirements: do not add either one just to make a report
look more complete. Use prose for context and interpretation, Markdown tables for comparable
evidence, and Mermaid for grounded architecture, topology, or flows. Do not invent rows, metrics,
priorities, components, or relationships. Prefer Mermaid to an ASCII diagram when both can express
the same grounded flow.

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
| Recommendation and Next Steps | Recommendation matrix when priority is evidenced |
| Traceability and Sources | Relative-link table or list |

For example, a success-criteria matrix is useful when each outcome has direct evidence:

| Success criterion | Status | Evidence |
|---|---|---|
| API endpoint available | Passed | End-to-end verification |
| Three scenarios validated | Passed | 3/3 recorded results |

When selected sources describe a real relationship or flow, use a grounded Mermaid diagram:

```mermaid
flowchart LR
  Client --> API
  API --> Rules
  Rules --> Result
```

Likewise, Project Resources are easier to scan as a table when the sources provide comparable
attributes:

| Resource | Type / provider | Purpose | Environment |
|---|---|---|---|
| `RES-model` | AI provider | Model inference | `poc` |
| `RES-monitoring` | Monitoring service | Experiment observability | `poc` |

Traceability must remain portable across GitHub, Kaddo Admin, and local clones. Use
repository-relative links such as `[POC definition](./poc.md)` or
`[WI-001](./work-items/completed/WI-001.md)`, never `file:///` URLs or local absolute paths.

Sections without evidence state `Not evaluated in this POC.`, `Not applicable.`, or `No evidence
available.` rather than inventing data. A report can recommend graduation to standard mode, but
the human decides whether to run `kaddo project mode standard`.

## Graduate or finish

When evidence supports a durable delivery effort, switch back to the standard flow and bootstrap
the remaining baseline:

```bash
kaddo project mode standard
kaddo bootstrap
```

When evidence rejects or cannot establish the hypothesis, record the conclusion in `poc.md` and
keep the decision trace without creating unnecessary product planning artifacts.
