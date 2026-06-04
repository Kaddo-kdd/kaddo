---
title: Operations templates
description: Security, standards, stack, git strategy, incident and runbook.
---

Global, system-wide operational artifacts. Install the documented ones with
`kaddo add`.

| Template | Purpose | Output path | Command | Agent |
|---|---|---|---|---|
| Security | Global security considerations (no scanning) | `knowledge/tech/security.md` | `kaddo add security` | `security-agent` |
| Standards | Lightweight coding/docs/testing standards | `knowledge/tech/standards.md` | `kaddo add standards` | `standards-agent` |
| Stack | System-wide stack | `knowledge/tech/stack.md` | `kaddo add stack` | `stack-agent` |
| Git Strategy | Branching, commits, tagging | `knowledge/tech/git-strategy.md` | `kaddo add git-strategy` | `git-strategy-agent` |
| Incident | Post-incident record | `knowledge/incidents/` | `kaddo add incident` | — |
| Runbook | Recurring operational task | `knowledge/runbooks/` | — | — |

## Security

Auth, data sensitivity, secrets, dependency and deployment risks. Documents concerns
for humans and agents — Kaddo does **not** scan code.

## Standards

A handful of high-value rules plus a PR checklist. No documentation theater.

## Stack

Languages, frameworks, data, infrastructure, tooling and unknowns to confirm.

## Git Strategy

Default **GitHub Flow + Conventional Commits + SemVer**, customizable via
`.kaddo/git.yml`. See [Git strategy](/modules/git-strategy/).

## Incident & Runbook

Incident: summary, impact, timeline, root cause, resolution, follow-up. Runbook:
when to use, prerequisites, steps, verification, rollback.
