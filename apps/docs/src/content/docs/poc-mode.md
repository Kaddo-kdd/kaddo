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
kaddo bootstrap
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
```

The canonical artifact is `knowledge/delivery/poc.md`. It records:

- Hypothesis
- Success Criteria
- Constraints
- Non-goals
- Evidence
- Conclusion: `validated`, `rejected`, or `inconclusive`

POC mode creates a proportional baseline: business problem and expected value, product scenario,
minimal technical context, and the POC artifact. It does not require a roadmap or a complete
capability map. Work Items keep their normal lifecycle; a `spike` is often the most natural first
experiment.

Run `kaddo understand`, `kaddo context`, or inspect `kaddo://poc` through MCP to see the current
POC status and the next recommended step.

## Graduate or finish

When evidence supports a durable delivery effort, switch back to the standard flow and bootstrap
the remaining baseline:

```bash
kaddo project mode standard
kaddo bootstrap
```

When evidence rejects or cannot establish the hypothesis, record the conclusion in `poc.md` and
keep the decision trace without creating unnecessary product planning artifacts.
