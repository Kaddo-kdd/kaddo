---
type: roadmap
updated_at: 2026-06-01
---

> Sample output generated from the Kaddo `roadmap-agent` prompt in an LLM chat.
> Illustrative — review before using. Kaddo did not generate this automatically.

# Task Pilot — Roadmap

## Initiatives

### RM-001 — Core task management

**Goal:** Let a single user capture, organize and complete tasks.
**Related capabilities:** task-capture, task-lists
**Impact:** High — the product's reason to exist.
**Risk:** Low — well-understood domain.
**Suggested Knowledge Level:** K2
**Dependencies:** none
**Why now:** Nothing works without the core loop.

#### Candidate Work Items

- **WI-CANDIDATE-001** — Add task reminders · type: feature · level: K2 · value: drives daily retention · notes: needs a scheduling decision.
- **WI-CANDIDATE-002** — Task lists & grouping · type: feature · level: K1 · value: basic organization.

### RM-002 — Reminders & notifications

**Goal:** Notify users before a task is due.
**Related capabilities:** reminders
**Impact:** Medium
**Risk:** Medium — depends on a scheduler/notification channel.
**Suggested Knowledge Level:** K3
**Dependencies:** RM-001

#### Candidate Work Items

- **WI-CANDIDATE-003** — Email reminder delivery · type: feature · level: K3 · value: re-engagement.

## Assumptions

- Single-user MVP first; multi-user is out of scope for now.

**Open questions:**

- In-app only, or email/push too?

## Suggested execution order

1. RM-001
2. RM-002

## Not now

- Team collaboration, sharing, mobile app.

## Quality checklist

- [x] Each initiative has a goal, impact and risk.
- [x] Candidates are marked as candidates, not decisions.
- [x] Priorities reflect the project state (new / pre-ai / legacy).
