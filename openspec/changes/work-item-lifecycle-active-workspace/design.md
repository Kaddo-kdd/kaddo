# Design: Work Item Lifecycle & Active Workspace

## Lifecycle model (`core/lifecycle.ts`)

```
draft → ready → in-progress → completed → archived
                     ↓  ↑
                   blocked
```

States: `draft`, `ready`, `in-progress`, `blocked`, `completed`, `archived`.

- **Active** (operational): `draft`, `ready`, `in-progress`, `blocked`.
- **Historical**: `completed`, `archived`.

> **Agent note:** Agents must treat only `draft`, `ready`, `in-progress` and `blocked` as active
> work. `completed` and `archived` are historical knowledge and should NOT dominate the context
> sent to the LLM. This is the main lever that keeps token cost bounded when a project has
> hundreds of Work Items.

### State resolution (deterministic, no LLM)

`lifecycleStateOf(workItem)` resolves a state from, in order:
1. front-matter `status` if it is a valid lifecycle state;
2. legacy status mapping for back-compat (`done → completed`, `cancelled → archived`,
   `in-progress → in-progress`);
3. the work-items subfolder the file lives in (`.../work-items/<state>/...`);
4. fallback `ready` — a flat `work-items/*.md` with no recognizable status is treated as `ready`.

Front-matter wins over folder so existing items (which declare `status` but no subfolder) keep
their meaning, and the resolver never needs to move files to be correct.

### Valid transitions (model only — not enforced by any command yet)

```
draft → ready
ready → in-progress
in-progress → completed
in-progress → blocked
blocked → ready
completed → archived
```

## Physical structure

```
knowledge/delivery/work-items/
  ├── draft/  ├── ready/  ├── in-progress/
  ├── blocked/  ├── completed/  └── archived/
```

`phase` and `initiative` stay in front matter (planning + functional grouping); they never
produce folders.

## Surface changes

- **artifact-reader**: expose `phase` and `initiative` front-matter fields.
- **create**: write new items into `work-items/draft/` with `status: draft`; `nextWorkItemId`
  scans recursively. Roadmap-materialized items also land in `draft/` (candidate → draft).
- **explain**: `workItems.byState` counts + `workItems.initiatives` virtual grouping; rendered as
  a "Work Items" lifecycle block plus per-initiative breakdown.
- **context**: include only active-state work items by default; exclude completed/archived.
- **understand**: show active counts (ready / in-progress) and recommend starting a `ready` item.
- **guard / ownership / roadmap**: unchanged.

## Compatibility

Existing flat `work-items/*.md` are interpreted via the resolver above (status-first, `ready`
fallback). No migration is forced; files can be reorganized into subfolders incrementally.
