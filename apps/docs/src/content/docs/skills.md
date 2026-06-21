---
title: Skills
description: Reusable, versionable capability definitions that standardize how agents do common things well — without adding permissions or automation.
---

Skills are **reusable capability definitions**. They standardize *how* to do a common thing well —
writing an ADR, refining a Work Item, proposing ownership — so agents stop repeating the same
instructions and produce consistent output.

```text
Agents orchestrate.   ← role and moment in the flow
Skills standardize.   ← reusable "how to do it well"
Knowledge grounds.    ← the project's real context
MCP exposes.          ← agents/IDEs can read both
```

> **A skill does not decide what to do — it defines how to do it well.** Skills never execute
> anything: no git, no LLM, no file changes. They are reusable instructions an agent applies.

## Agents vs skills

| | Agent | Skill |
|---|---|---|
| Defines | the role + moment in the flow | one reusable capability |
| Example | `work-item-agent` | `work-item-refinement` |
| Decides | *what* to do next | *how* to do one thing well |
| Reused by | — | many agents |

An agent uses several skills — e.g. `work-item-agent` applies `work-item-refinement` and
`ownership-suggestion`.

## Install

```bash
kaddo add skills                      # recommended set (delivery + tech)
kaddo add skills --all                # every skill
kaddo add skills --group delivery     # one group
kaddo add skills --group tech
kaddo add skills --group integration
```

Skills install into `knowledge/skills/<id>/skill.md`. Existing files are never overwritten.

## The initial skills

| Skill | Group | Standardizes | Applies to |
|---|---|---|---|
| `work-item-refinement` | delivery | problem · scope · acceptance · validation · DoD | work-item / backlog / roadmap agents |
| `implementation-planning` | delivery | scope · files · risks · steps · stop criteria | implementation / work-item agents |
| `learning-capture` | delivery | what changed · learned · knowledge to update | implementation / guard / architecture agents |
| `adr-writing` | tech | context · decision · alternatives · governed paths | decision / architecture / implementation agents |
| `ownership-suggestion` | tech | precise `code:` globs | ownership / work-item / graph agents |
| `graph-metadata-review` | tech | hints → `capabilities`/`decisions`/`code`/`capsules` | graph / ownership / work-item agents |
| `capsule-writing` | integration | purpose · contracts · risks · no secrets/source | capsule / architecture / product agents |

Each `skill.md` has standard front matter (`type: skill`, `id`, `title`, `version`, `group`,
`applies_to`) and sections: Purpose · When to use · Inputs · Output · Rules · Quality checklist ·
Example output.

## How agents reference skills

Installed agent prompts include a **Reusable Skills** section listing the skills they should apply.
For example the `graph-agent` prompt points to `graph-metadata-review`, and `work-item-agent` points
to `work-item-refinement` and `ownership-suggestion`.

## In the CLI

- `kaddo context` lists available skill ids under `## Skills` (a summary — never the full content).
- `kaddo explain` reports `Skills installed: N` with per-group counts.
- `kaddo understand` recommends skills for the agents it recommends.

## Over MCP

The [MCP server](/mcp-server/) exposes skills read-only: the `kaddo://skills` resource lists them,
`kaddo://skills/<id>` returns one, the `kaddo_list_skills` / `kaddo_get_skill` tools query them, and
each skill is also available as a reusable prompt.

## Out of scope

No skill execution, no auto-apply, no automatic artifact edits, no workflow engine, no
multi-agent orchestration. Skills add consistency, not permissions.
