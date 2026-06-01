---
title: Pre-AI project
description: Prepare an existing repo that was not designed for AI-assisted development.
---

**When to use this:** you have a working codebase that was never prepared for AI-assisted
development. The knowledge exists, but it is scattered and not structured for humans or LLM
agents.

## Workflow

```bash
kaddo init          # state: pre-ai, team size, structure
kaddo scan          # deterministic technical inventory → .kaddo/scan.json
kaddo context       # LLM context pack → .kaddo/context-pack.md
kaddo add agents    # install agent prompt packs
kaddo understand    # guided CLI → LLM handoff plan
# ── in your LLM, use capability-agent, architecture-agent and roadmap-agent to draft
#    capabilities, the architecture baseline and a roadmap ──
kaddo create --from roadmap   # turn a roadmap candidate into a Work Item
kaddo owners suggest          # declare code: ownership on the Work Item
kaddo guard                   # detect possible knowledge drift
kaddo explain                 # summarize what Kaddo currently knows
```

## CLI vs LLM

- **CLI (deterministic):** `scan` builds a technical inventory; `context` packages it;
  `create`, `owners suggest`, `guard` and `explain` keep knowledge connected to code.
- **LLM (interpretation):** the capability-agent extracts business capabilities, the
  architecture-agent reconstructs the current architecture, and the roadmap-agent proposes a
  prioritized roadmap — all from the context pack, not from guesses.

`kaddo scan` detects signals and asks confirmation questions; it never claims to understand
your business capabilities. That interpretation happens in the LLM.

## Expected artifacts

```txt
.kaddo/scan.json
architecture/inventory.md
architecture/capabilities.md
architecture/current-state.md
architecture/roadmap.md
architecture/work-items/*.md
.kaddo/explain.md
```

## Next steps

Start with the highest-value capabilities, declare ownership on the artifacts that map to real
code, and let `kaddo guard` warn you when changes drift from the documented knowledge. See the
[Full workflow](/use-cases/full-workflow/).

See it in action: the [**Loyalty Lite**](https://github.com/judlup/kaddo/tree/main/examples/pre-ai-project)
demo repo (includes a Guard drift demo), or browse all [Examples](/examples/).
