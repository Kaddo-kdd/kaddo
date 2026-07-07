---
title: kaddo ready
description: Mark a draft Work Item as ready for implementation after human review.
---

```bash
kaddo ready WI-001
```

Transitions a draft Work Item to `ready` after human review. This is the explicit approval
step between refinement (work-item-agent) and implementation (implementation-agent).

## What it does

1. Finds the Work Item by ID across all lifecycle folders.
2. Shows a summary: type, knowledge level, domains, source, code ownership, acceptance
   criteria count, and any warnings.
3. Asks for confirmation (unless `--yes` is passed).
4. Updates `status: draft` → `status: ready` in the frontmatter.
5. Adds a `ready_at` timestamp.
6. Moves the file from `work-items/draft/` to `work-items/ready/`.

## Warnings

Before confirming, Kaddo checks for common issues:

- No acceptance criteria section found.
- No code ownership globs declared.
- No validation section found.
- Open questions still present (ignored if marked as "None", "Resolved", or "Deferred").
- No domains declared.

Warnings are advisory — the user can proceed anyway.

## Options

| Flag    | Description                    |
|---------|--------------------------------|
| `--yes` | Skip the confirmation prompt.  |

## After marking ready

Run `kaddo context && kaddo understand` to refresh the handoff. Kaddo will switch from
recommending `work-item-agent` to `implementation-agent`.

```bash
kaddo ready WI-001
kaddo context
kaddo understand
```

## Design principles

- **Human approval**: agents refine, humans approve. `kaddo ready` is the approval gate.
- **Ready ≠ implemented**: marking ready means the scope is clear, not that code exists.
- **No LLM, no git**: the command is fully deterministic and never mutates version control.
- **Metadata preserved**: source, domains, code globs, generated_by, template_version, and
  the full markdown body are untouched.

## Example

```text
┌  kaddo ready WI-001
│
●  Work Item found:
│  WI-001 — Listar últimas compras en reportes de métricas generales
│
●  Status: draft → ready
●  Type: bugfix
●  Knowledge level: K2
●  Domains: loyalty
●  Source: manual
●  Code ownership:
│    - src/hooks/useAdminMetrics.ts
│    - src/app/dashboard/page.tsx
│
◇  Mark this Work Item as ready for implementation?
│  Yes
│
◆  Updated status: ready
◆  Moved file:
│  knowledge/delivery/work-items/draft/WI-001-...md
│  → knowledge/delivery/work-items/ready/WI-001-...md
│
└  Work Item WI-001 is ready.
```
