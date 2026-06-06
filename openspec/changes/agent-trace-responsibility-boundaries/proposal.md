# Proposal: Agent Trace & Responsibility Boundaries (VS-044)

## Why

Validating `todoApp` surfaced two problems:

1. **No traceability.** After several iterations it was unclear which agent produced an artifact
   (e.g. `roadmap.md`), what it used, and what should run next.
2. **Agents acting outside their responsibility.** The roadmap-agent suggested
   `Create branch feature/wi-001-...` before any Work Item was even materialized.

## What

Formalize execution traceability between agents and define explicit responsibility boundaries.

- **Agent Trace**: every official prompt ends with a standard block — `Agent / Produced / Next` —
  so each response says who produced the result, what it produced and what comes next.
- **Responsibility Matrix**: an official table of what each agent is responsible for, produces,
  may suggest and must NOT suggest.
- **Git responsibility model**: only the **implementation-agent** may suggest a branch, and only
  by respecting the project Git strategy. roadmap-agent, work-item-agent, business-agent and
  product-agent must not suggest branches/commits/PRs.
- **Handoff rules**: roadmap-agent → `kaddo create --from roadmap` → work-item-agent →
  implementation-agent → scan → owners suggest → guard → explain.
- `understand` recommends agents following these handoffs.
- New official prompt: **implementation-agent** (the delivery/branch protocol moves here from the
  work-item-agent).

Agents still only produce knowledge — they never run Git, code or commands.

## Impact

- Predictable, auditable agent flow; no agent drifts outside its lane.
- Out of scope: agent auto-execution, multi-agent orchestration, automatic branch/commit, GitHub
  integration, MCP.
