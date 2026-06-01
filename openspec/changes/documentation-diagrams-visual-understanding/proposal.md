# Proposal: Documentation Diagrams & Visual Understanding

## Problem

Kaddo has a complete documentation set — use cases, examples, templates and a playbook —
but understanding still depends heavily on text. Because Kaddo combines a deterministic
CLI, LLM agent prompts, knowledge artifacts, ownership, Guard and multirepo mapping, new
users need visual explanations to grasp the system quickly.

Without diagrams, users may misunderstand the CLI/LLM boundary, miss how artifacts
connect across the workflow, or assume automation that does not exist.

## Proposed Change

Add a dedicated **Visual Guide** page (EN/ES) with Mermaid diagrams that explain Kaddo
visually: the full knowledge loop, CLI vs LLM responsibilities, the human/CLI/LLM
sequence, artifact dependencies, project states, multirepo mapping, Guard Lite and
governance levels — plus a high-level mindmap.

## Why Now

The implemented loop is stable:

```txt
init → scan → context → add agents → understand → roadmap → create --from roadmap → owners suggest → guard → explain
```

The next step is making that loop easy to understand and present.

## Scope

- Add a Visual Guide page (EN/ES) with Mermaid diagrams.
- Add the page to the sidebar.
- Link it from README and the docs homepage.
- Keep EN/ES parity.
- Reflect implemented capabilities only.

## Out of Scope

- New CLI commands.
- Runtime / auto-generated diagrams.
- External diagram rendering services.
- Redesigning the docs site.
- Screenshots or videos.
- Calling LLMs.

## Expected Value

Users understand Kaddo faster through visual models. The diagrams become reusable
material for README, talks, onboarding and community content.

## Risks

- Diagrams may drift from implementation → tie them to documented commands; add a note
  that they show the implemented v2.6+ loop.
- Too many diagrams may overwhelm → one focused diagram per concept with a short caption.
- Mermaid syntax may break the docs build → validate with `pnpm --filter docs build`.
- Diagrams may imply unsupported automation → explicit "what this does NOT mean" note.

## Success Criteria

A new user can open the Visual Guide and understand the full loop, the CLI/LLM split,
artifact flow, Guard, multirepo mapping, project states and governance — without any
diagram implying Kaddo calls LLMs, Guard blocks, or ownership is inferred.
