---
title: Project Route
description: Visual lifecycle progress map for your project.
---

The **Project Route** is a deterministic progress map that shows where your project sits
in its lifecycle — which steps are done, which is current, and what comes next.

## How it works

Kaddo classifies your project as **new**, **pre-ai**, or **legacy** (from `project.state`
in `.kaddo/config.yml`) and builds a route of ordered steps. Each step is evaluated against
real project state: config presence, scan baseline, knowledge artifact quality, Work Items,
ADRs, adapters, and guard history.

## Step statuses

| Marker | Status    | Meaning                                    |
|--------|-----------|--------------------------------------------|
| `[x]`  | done      | Step completed with evidence               |
| `[>]`  | current   | The step you should work on now            |
| `[ ]`  | pending   | Not yet reachable                          |
| `[~]`  | warning   | Exists but needs attention (e.g. weak quality) |
| `[!]`  | blocked   | Cannot proceed until a dependency is resolved |
| `[-]`  | skipped   | Intentionally skipped                      |
| `[o]`  | optional  | Not required for progress                  |

## Where it appears

- **`kaddo explain`** — full checklist in the Explain output.
- **`kaddo context`** — compact summary in the context pack.
- **`kaddo understand`** — compact summary in the understand handoff.
- **MCP resource** — `kaddo://project-route` returns the full route as JSON.

## JSON model

```json
{
  "type": "pre-ai",
  "currentStep": "define-business",
  "completed": 2,
  "total": 15,
  "progressPercent": 13,
  "steps": [
    {
      "id": "enable-kaddo",
      "label": "Enable Kaddo",
      "status": "done",
      "evidence": [".kaddo/config.yml"]
    }
  ]
}
```

Each step may include `evidence`, `reason`, `command`, `agent`, and `skill` fields
to guide you toward completing it.

## Route definitions

- **New** (12 steps): init → business → product → capabilities → architecture → decisions → work source → materialize → refine → ownership → prepare → guard.
- **Pre-AI** (15 steps): adds scan, resolve ADRs, and capture learning.
- **Legacy** (15 steps): adds identify legacy modules and identify operational risks.
