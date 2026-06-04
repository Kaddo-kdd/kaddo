---
title: kaddo create
description: Create a Work Item with the minimum context for its Knowledge Level.
---

```bash
kaddo create feature   # K2: 4 questions
kaddo create bugfix    # K2: 4 questions
kaddo create hotfix    # K1: 2 questions
kaddo create spike     # K3: 4 questions
```

Optional modules add more types (`adr`, `rfc`, `incident`, `migration`, `legacy`,
`contract`, `capability`, `guard-rule`, `agent`, `skill`). See
[Modules](/modules/overview/).

## Create from a roadmap candidate

Once the roadmap-agent has produced `knowledge/delivery/roadmap.md`, you can turn a candidate work
item into a real Work Item without retyping its context:

```bash
kaddo create --from roadmap
# or pre-pick a type as default:
kaddo create feature --from roadmap
```

Kaddo reads `knowledge/delivery/roadmap.md`, lets you select a candidate (`WI-CANDIDATE-001`, …),
and prefills the Work Item from the roadmap: title, type, suggested Knowledge Level, expected
value, notes, related capabilities/impact/risk/dependencies, and the parent initiative. It
asks only for the required fields the candidate does not already provide.

The generated Work Item keeps **source traceability** in its front matter:

```yaml
---
type: spike
id: WI-001
knowledge_level: K2
status: in-progress
source: roadmap
source_id: WI-CANDIDATE-001
source_initiative: RM-001
---
```

This completes the Kaddo loop: `scan → context → agents → roadmap → work item`. The roadmap
is generated in your LLM chat (never by the CLI), and its candidates are not Work Items until
you create them here.

> If `knowledge/delivery/roadmap.md` is missing, or it contains no candidates in the Kaddo Roadmap
> Agent format, Kaddo shows a helpful message instead of creating an empty Work Item.

## Activate Guard Lite

Add code globs to the `code:` field of the generated front matter:

```yaml
---
type: feature
id: WI-001
code:
  - src/payments/**
  - src/shared/payment/**
---
```
