---
title: New project
description: Use Kaddo to start a new project with structured knowledge from day one.
---

**When to use this:** you are starting a greenfield project and want to avoid scattered
decisions from day one — a lightweight knowledge layer that grows with the code.

## Workflow

```bash
kaddo init          # state: new, team size, structure
kaddo bootstrap     # initial knowledge base: Business → Product → Tech → Delivery
kaddo context       # LLM context pack → .kaddo/context-pack.md
kaddo add agents    # install agent prompt packs
kaddo understand    # guided CLI → LLM handoff plan
# ── in your LLM, use business-agent + bootstrap-agent to refine the knowledge base,
#    then roadmap-agent and architecture-agent to draft the roadmap and architecture ──
kaddo create --from roadmap   # turn a roadmap candidate into a Work Item
kaddo owners suggest          # declare code: ownership on the Work Item
kaddo guard                   # detect possible knowledge drift
kaddo explain                 # summarize what Kaddo currently knows
```

For a brand-new repo you can skip `kaddo scan` (there is little code to detect yet) and start
from the roadmap. Run `scan` later once the codebase grows.

## CLI vs LLM

- **CLI (deterministic):** `init`, `context`, `add agents`, `understand`, `create`,
  `owners suggest`, `guard`, `explain`.
- **LLM (interpretation):** use the roadmap-agent and architecture-agent in your chat to shape
  the first roadmap and the intended architecture from the context pack.

Kaddo never calls an LLM — it prepares the context; your LLM does the thinking.

## Expected artifacts

```txt
.kaddo/config.yml
.kaddo/context-pack.md
.kaddo/understand.md
knowledge/delivery/roadmap.md
knowledge/tech/current-state.md
knowledge/delivery/work-items/*.md
.kaddo/explain.md
```

## Next steps

Keep creating Work Items from the roadmap, declare ownership as the code lands, and run
`kaddo guard` before commits so knowledge stays connected to code. See the
[Full workflow](/use-cases/full-workflow/) for the complete loop.

See it in action: the [**Task Pilot**](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/new-project)
demo repo, or browse all [Examples](/examples/).
