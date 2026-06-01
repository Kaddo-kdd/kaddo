---
title: Work Item Traceability
description: How a roadmap candidate becomes a Work Item, connects to code via ownership, triggers Guard signals and preserves learning.
---

Traceability is what makes Kaddo a knowledge system rather than a folder of documents. Every
Work Item can be traced back to why it exists and forward to the code it governs.

## The traceability chain

```txt
Roadmap initiative
  ↓
Candidate Work Item
  ↓
Kaddo Work Item
  ↓
Ownership metadata
  ↓
Code change
  ↓
Guard signal
  ↓
Learning
```

Each link answers a question:

- **Roadmap initiative** — why is this on our radar?
- **Candidate Work Item** — what specifically should we do?
- **Kaddo Work Item** — the committed, traceable unit of work.
- **Ownership metadata** — what code does this knowledge govern?
- **Code change** — the actual implementation.
- **Guard signal** — did the code move without the knowledge?
- **Learning** — what should the next person know?

## Example front matter

```yaml
---
type: feature
id: WI-20260601-001
status: proposed
knowledge_level: K2
source: roadmap
source_id: WI-CANDIDATE-001
source_initiative: RM-001
domains:
  - loyalty
capabilities:
  - points-management
code:
  - src/points/**
---
```

| Field | Meaning |
|---|---|
| `type` | Kind of Work Item: feature, bugfix, hotfix, spike, migration… |
| `id` | Unique, stable identifier for this Work Item |
| `status` | Lifecycle state: proposed, in-progress, done, cancelled |
| `knowledge_level` | Minimum context required (K0–K4) — see [Concepts](/playbook/concepts/) |
| `source` | Where this Work Item came from (e.g. `roadmap`) |
| `source_id` | The roadmap candidate that produced it |
| `source_initiative` | The higher-level roadmap initiative |
| `domains` | Business/product domains this touches |
| `capabilities` | Product capabilities this affects |
| `code` | Glob patterns that connect this artifact to code (used by Guard) |

## How Guard uses traceability

When you change `src/points/checkout.ts`, `kaddo guard` reads the `git diff`, finds that the
file matches `WI-20260601-001`'s `code:` glob, and — if the Work Item was not updated in the
same diff — shows a non-blocking FYI. The signal points reviewers at knowledge that may now
be stale.

---

Next: [Examples with Other Tools](/playbook/tool-examples/) — how Kaddo fits your stack.
