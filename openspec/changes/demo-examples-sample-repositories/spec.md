# Spec: Demo Examples & Sample Repositories

## User Story

As a new Kaddo user, I want realistic examples for my project scenario, so that I can
understand how to apply Kaddo without guessing.

## Acceptance Criteria

### AC1 — New Project example exists
`examples/new-project/` with a README explaining structured knowledge from day one.

### AC2 — Pre-AI Project example exists
`examples/pre-ai-project/` with the scan/context/agents/roadmap/work-item/guard workflow.

### AC3 — Legacy Project example exists
`examples/legacy-project/` with a legacy-agent-first workflow and risk/unknowns artifacts.

### AC4 — Multirepo Workspace example exists
`examples/multirepo-workspace/` showing an architecture repo + module repos.

### AC5 — Each example has a README
Explaining scenario, project state, commands, generated artifacts, CLI vs LLM
responsibilities and next steps.

### AC6 — Full workflow example exists
At least one example shows `init → scan → context → add agents → understand →
create --from roadmap → owners suggest → guard → explain`.

### AC7 — Agent output samples are clearly marked
Sample LLM outputs are labeled as illustrative, not guaranteed automation.

### AC8 — Guard example exists
At least one example demonstrates ownership + Guard drift detection.

### AC9 — Docs link to examples
README and docs link to the examples.

### AC10 — No overpromise
Examples must not imply Kaddo calls LLMs, generates code or understands systems
automatically.

## Validation

```bash
pnpm -r build
```

Manual review: open each example README, follow the flow, check artifacts exist, confirm
doc links work.
