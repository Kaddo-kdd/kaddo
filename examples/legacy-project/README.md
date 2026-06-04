# Example: Legacy Project — *Old Orders*

A legacy Express MVC order-management app where knowledge lives in people's heads. Shows
how Kaddo supports **understand-before-change**.

- **Project state:** `legacy`
- **Structure:** monorepo
- **Domain:** orders, invoicing

## The flow

```bash
kaddo init
kaddo scan
kaddo context
kaddo add agents
kaddo understand
# in your LLM chat, legacy first:
#   legacy-agent      → knowledge/legacy/{risks,unknowns,modernization-candidates}.md
#   architecture-agent → knowledge/tech/current-state.md
#   roadmap-agent     → knowledge/delivery/roadmap.md
kaddo create --from roadmap      # a safe first work item
kaddo owners suggest
kaddo guard
kaddo explain
```

## Why legacy-agent first

Before changing legacy code you map the **risks** and **unknowns** so a change does not
break something nobody remembers. Only then do you reconstruct the architecture baseline
and propose a roadmap.

## What to inspect

| File | Who wrote it |
|---|---|
| `knowledge/legacy/risks.md` | **Illustrative** `legacy-agent` output |
| `knowledge/legacy/unknowns.md` | **Illustrative** `legacy-agent` output |
| `knowledge/legacy/modernization-candidates.md` | **Illustrative** output |
| `sample-agent-outputs/current-state.md` | **Illustrative** `architecture-agent` output |
| `knowledge/delivery/work-items/WI-001-add-order-status-logging.md` | CLI (`create`) — a low-risk first step |

See [`expected-flow.md`](./expected-flow.md), and
[`prompt-flow.md`](./prompt-flow.md) for the prompts, diagram and safe-change guidance.
