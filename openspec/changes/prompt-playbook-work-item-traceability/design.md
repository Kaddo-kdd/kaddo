# Design: Prompt Playbook & Work Item Traceability Guide

## Documentation Structure

Pages (under a new `Playbook` sidebar group):

```txt
Playbook
  Concepts
  Prompt Workflow
  Work Item Traceability
  Examples with Other Tools
  Collaboration Guide
```

Paths (aligned to the current Starlight structure — EN at docs root, ES under `es/`):

```txt
apps/docs/src/content/docs/playbook/concepts.md
apps/docs/src/content/docs/playbook/prompt-workflow.md
apps/docs/src/content/docs/playbook/work-item-traceability.md
apps/docs/src/content/docs/playbook/tool-examples.md
apps/docs/src/content/docs/playbook/collaboration.md
apps/docs/src/content/docs/es/playbook/concepts.md
apps/docs/src/content/docs/es/playbook/prompt-workflow.md
apps/docs/src/content/docs/es/playbook/work-item-traceability.md
apps/docs/src/content/docs/es/playbook/tool-examples.md
apps/docs/src/content/docs/es/playbook/collaboration.md
```

Sidebar slugs use `playbook/<page>`; the ES URL is `/es/playbook/<page>/`.

## Concepts Page

Defines the project's own language: Work Item, Knowledge Level, Context Pack, Agent Prompt
Pack, Ownership, Knowledge Drift, Guard Lite, Explain.

A Work Item is the smallest traceable unit of product evolution in Kaddo — not only a task.
It can represent a feature, hotfix, bugfix, spike, architecture change, migration, incident
follow-up, capability improvement or knowledge update. It captures why the change exists,
what context is required, what knowledge level applies, what produced it, what code ownership
it touches and what learning should be preserved.

Knowledge Levels K0–K4 define the minimum context required before acting.

## Prompt Workflow Page

A table mapping each step to CLI input, LLM prompt/agent, expected output and save target,
plus copy/paste prompt examples for capability-agent, architecture-agent, roadmap-agent,
legacy-agent and adr-agent.

## Work Item Traceability Page

Explains the flow `roadmap → candidate work item → Kaddo work item → ownership → guard →
learning` and documents an example front matter with field-by-field explanations.

## Examples with Other Tools Page

Usage patterns (not official integrations) with GitHub Issues, Jira/Linear, OpenSpec,
BMAD/Gentle-AI and Cursor/Claude/ChatGPT/Windsurf.

## Collaboration Guide

Lightweight, governance-by-exception model: role expectations, Guard warnings as review
signals (not blockers), a PR checklist, and rules to avoid documentation bureaucracy. Make
small-team and indie usage explicit so it does not feel enterprise-heavy.

## README / Docs Navigation

Add a `Playbook` sidebar group and a `## Playbook` section in the README linking the five
pages.

## EN/ES Parity

All five pages exist in both languages.

## Risks

The collaboration guide may sound too enterprise-heavy. Mitigation: keep advice lightweight,
emphasize governance by exception, make indie/small-team usage explicit.
