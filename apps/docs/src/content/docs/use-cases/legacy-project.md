---
title: Legacy project
description: Understand a fragile system before changing it, and reduce risk with Kaddo.
---

**When to use this:** you maintain a legacy system where knowledge lives in people's heads,
changes are risky, and you need to understand before you touch anything.

The guiding principle for legacy projects is **understand before changing.**

## Workflow

```bash
kaddo init          # state: legacy, team size, structure
kaddo scan          # deterministic technical inventory → .kaddo/scan.json
kaddo context       # LLM context pack → .kaddo/context-pack.md
kaddo add agents    # install agent prompt packs
kaddo understand    # guided CLI → LLM handoff plan
# ── in your LLM, use legacy-agent FIRST to map risks, unknowns and modernization
#    candidates, then architecture-agent, capability-agent and roadmap-agent ──
kaddo create --from roadmap   # small, low-risk Work Items from the roadmap
kaddo owners suggest          # declare code: ownership on each Work Item
kaddo guard                   # detect possible knowledge drift
kaddo explain                 # summarize what Kaddo currently knows
```

## CLI vs LLM

- **CLI (deterministic):** `scan` inventories the stack and surfaces open questions; `create`
  keeps Work Items small; `owners suggest` and `guard` connect knowledge to fragile code.
- **LLM (interpretation):** the legacy-agent identifies risks, unknowns and modernization
  candidates; the other agents reconstruct architecture and capabilities and propose a careful
  roadmap.

Kaddo does **not** understand a legacy system automatically. It structures signals and guides
your LLM — the human stays in control of every change.

## Expected artifacts

```txt
architecture/legacy/risks.md
architecture/legacy/unknowns.md
architecture/legacy/modernization-candidates.md
architecture/current-state.md
architecture/capabilities.md
architecture/roadmap.md
architecture/work-items/*.md
```

## Next steps

Prefer small Work Items, capture unknowns as you learn, and declare ownership on the riskiest
areas first so `kaddo guard` flags changes that may need knowledge review. See the
[Full workflow](/use-cases/full-workflow/).

See it in action: the [**Old Orders**](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/legacy-project)
demo repo, or browse all [Examples](/examples/).
