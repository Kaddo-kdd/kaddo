---
title: Open Questions Gate
description: A readiness gate so agents don't generate a roadmap, Work Items or implementation plans on top of unconfirmed open questions.
---

`kaddo bootstrap` leaves `## Open Questions` sections in the knowledge files — but those questions
are easy to forget. This VS turns them into a **readiness gate**: before generating a roadmap,
creating Work Items or implementing, agents check whether **blocking** decisions are still open and
ask you to resolve, assume or defer them first.

> Open question ≠ decorative documentation. A question should reach an outcome: **resolved**,
> **assumed** or **deferred**.

This is **not** a mandatory CLI step — the main flow (`init → scan → add agents → context →
understand → bootstrap`) is unchanged. The gate lives where agents act.

## Optional command

```bash
kaddo questions          # summary of open questions + roadmap readiness
kaddo readiness          # alias
kaddo questions --json
kaddo questions --output .kaddo/reports/questions-report.md
```

```text
Open questions detected: 4
Roadmap readiness: needs decisions

Blocking:
- Will the project be a backend API, web app or CLI?
- Fastify or NestJS?

Suggested next:
Confirm suggested assumptions with the user before generating the roadmap.
```

## Classification

Each question found in `business.md`, `product.md`, `codebase.md` or `roadmap.md` is classified by
conservative, deterministic keyword heuristics (when in doubt → `important`):

| Class | Meaning | Examples |
|---|---|---|
| **blocking** | affects scope, architecture or the first Work Items | API vs web vs CLI, stack/framework, auth, persistence, MVP |
| **important** | relevant, but a temporary assumption can unblock | sponsors, pagination, roles, validations |
| **deferred** | can move to a later phase | integrations, analytics, notifications, payments |

Roadmap readiness is **`needs_decisions`** when any blocking question is **open**, **`ready`** when
none are, **`unknown`** when no open questions exist. Blocking open questions get a neutral
**suggested assumption** (never invented specifics — "start as a backend API to keep scope small").

## Resolution tracking

A question isn't only text — it has a **resolution status**. Prefix a bullet with a token so Kaddo can
tell a genuinely pending question from one already decided, assumed or postponed:

```md
## Open Questions

- [open] Are projects referenced by numeric id, name, or both in the CLI?
- [resolved] Projects are referenced by numeric id in the CLI.
- [assumed] Assume local persistence uses SQLite for the MVP.
- [deferred] Remote project sync is out of the MVP.
```

Spanish tokens work too: `[abierta]`, `[resuelta]`, `[asumida]`, `[diferida]`. A bullet **without** a
token is treated as `open` (fully backward compatible). Optional metadata can follow as an indented
sub-bullet, e.g. `- note: name is display-only` → `resolution_note`.

**Only `open` questions block readiness.** A `blocking` question that is `resolved`, `assumed` or
`deferred` no longer blocks — it's surfaced for context (assumptions to revisit, items out of scope)
but execution continues. `kaddo questions` reports counts by status and `--json` carries
`resolution_status` (and `resolution_note`) per question plus a `resolution` count summary.

| Classification + status | Blocks readiness? |
|---|---|
| blocking + `open` | yes |
| blocking + `resolved` / `assumed` / `deferred` | no (surfaced as decision / assumption / out-of-scope) |

## How agents use it

The `roadmap-agent`, `work-item-agent`, `implementation-agent` and `bootstrap-agent` prompts now
check the gate. For example, asked to *"generate the roadmap"* with blocking questions open, the
roadmap-agent pauses:

> Before generating the roadmap I found blocking open questions that affect the MVP scope.
> I can proceed with these assumptions: … Confirm and continue?

It only proceeds once you confirm the assumptions (or resolve/defer the questions), and records the
confirmed assumptions in the roadmap. `kaddo understand` also nudges you when blocking questions
exist.

## Over MCP

Read-only: `kaddo://open-questions` (classified questions) and `kaddo://roadmap-readiness`
(decision-oriented summary), plus the `kaddo_generate_questions_report` tool (writes only under
`.kaddo/reports/`). Nothing resolves questions automatically, edits knowledge or calls an LLM.

## Limits

Kaddo never modifies `business.md` / `product.md` / `codebase.md`, never resolves questions without
human confirmation, never blocks CLI commands and never forces you to answer everything. It surfaces
decisions at the right moment — keeping the roadmap from being built on invisible assumptions.
