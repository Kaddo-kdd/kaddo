# Example: Pre-AI Project — *Loyalty Lite*

An existing Next.js + API app with a loyalty-points domain. Shows how to **prepare an
existing project for AI-assisted evolution** — and includes a **Guard drift demo**.

- **Project state:** `pre-ai`
- **Structure:** monorepo
- **Domain:** loyalty points, rewards

## The full loop

```bash
kaddo init
kaddo scan                       # → .kaddo/scan.json, architecture/inventory.md
kaddo context                    # → .kaddo/context-pack.md
kaddo add agents
kaddo understand
# in your LLM chat: capability-agent → architecture-agent → roadmap-agent
kaddo create --from roadmap      # → architecture/work-items/WI-001-*.md
kaddo owners suggest             # declare code: globs
kaddo guard                      # detect knowledge drift
kaddo explain
```

## Guard drift demo

`WI-001` declares ownership over the loyalty code:

```yaml
code:
  - sample/src/loyalty/**
```

Now change the code without updating the work item:

```bash
# edit sample/src/loyalty/points.ts (e.g. change the earn rate)
kaddo guard
```

Expected (non-blocking FYI):

```
  ⚠ Possible knowledge drift: WI-001 (feature, K2)
    Changed code matching this artifact:
      - sample/src/loyalty/points.ts
    WI-001 was not updated in this diff.
```

Guard is **silent** until an artifact declares `code:` ownership — no noise on day one.

## What to inspect

| File | Who wrote it |
|---|---|
| `.kaddo/scan.json`, `architecture/inventory.md` | CLI (`scan`) |
| `sample-agent-outputs/capabilities.md` | **Illustrative** LLM output |
| `sample-agent-outputs/current-state.md` | **Illustrative** LLM output |
| `sample-agent-outputs/roadmap.md` | **Illustrative** LLM output |
| `architecture/work-items/WI-001-loyalty-tiers.md` | CLI (`create --from roadmap`) |

See [`expected-flow.md`](./expected-flow.md).
