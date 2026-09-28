---
title: Examples with Other Tools
description: Usage patterns for combining Kaddo with GitHub Issues, Jira/Linear, Build Contract, agent frameworks and LLM chats.
---

Kaddo is the **knowledge layer near the code**. It does not replace your issue tracker,
delivery board or agent framework — it complements them.

> These are **usage patterns**, not official integrations. Kaddo does not connect to these
> tools automatically unless an integration is explicitly implemented.

## Kaddo + GitHub Issues

Use Kaddo for knowledge and traceability, GitHub Issues for task tracking.

```txt
Kaddo Work Item → GitHub Issue
```

Keep the Work Item ID in the issue title or body so the knowledge and the task stay linked.

## Kaddo + Jira / Linear

Use Jira/Linear for delivery boards and reporting, Kaddo for product knowledge near the code.

```txt
Roadmap candidate → Kaddo Work Item → Jira/Linear ticket
```

The ticket tracks delivery; the Work Item preserves why and what knowledge applies.

## Kaddo + Build Contract

Use the Kaddo-native Build Contract for structured change proposals and the Work Item
lifecycle for delivery.

```txt
Work Item draft → refine → ready → handoff → implement → verify → complete
```

The Build Contract replaces external specification tools with a native lifecycle that keeps
all knowledge near the code. See the `implementation-planning` skill for design deliberation.

> **Historical note:** OpenSpec artifacts remain under `openspec/` as reference for earlier
> changes but are no longer the active workflow.

## Kaddo + BMAD / Gentle-AI

Use those tools for agent workflows and Kaddo as the knowledge layer they read from and write
back to.

```txt
Kaddo context pack → agent framework → Kaddo artifacts
```

## Kaddo + Cursor / Claude / ChatGPT / Windsurf

Use Kaddo context packs and agent prompts directly inside your LLM chat.

```txt
.kaddo/context-pack.md + knowledge/agents/*.md → LLM output → knowledge/*.md
```

The CLI prepares the input; your LLM produces understanding; you save it back as artifacts.

---

Next: [Collaboration Guide](/playbook/collaboration/) — operating Kaddo as a team.
