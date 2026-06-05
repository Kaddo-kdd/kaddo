# Spec: Work Item Lifecycle & Active Workspace

## Lifecycle
- States: `draft`, `ready`, `in-progress`, `blocked`, `completed`, `archived`.
- Active states: `draft`, `ready`, `in-progress`, `blocked`. Historical: `completed`, `archived`.
- `lifecycleStateOf` resolves: valid status → legacy map → folder → `ready` fallback.
- Transitions (model only): draft→ready, ready→in-progress, in-progress→{completed,blocked},
  blocked→ready, completed→archived.

## Work Item definition
- Work Item front matter keeps `phase` and `initiative` as metadata.
- Generated Work Items include `Out of scope` and `Validation` sections.

## Out of scope
- `kaddo work-item move`, `kaddo archive`, transition/archival automation, roadmap sync,
  branch/commit automation.

## Validation
- `pnpm --filter "@kaddo/cli" test` green; `pnpm -r build` green.
- Lifecycle unit tests (resolution, legacy map, folder, fallback, counts).
- explain counts per state + initiative grouping; context excludes completed/archived; guard
  still finds items in subfolders.

## Acceptance criteria
- **AC1** Official lifecycle exists.
- **AC2** States are exactly the six above.
- **AC3** Work Items organized physically by state (create → `draft/`).
- **AC4** `phase` and `initiative` remain in front matter (no folders).
- **AC5** explain shows counts per state.
- **AC6** context prioritizes active Work Items (excludes completed/archived by default).
- **AC7** understand uses the lifecycle.
- **AC8** Guard keeps working (recursive `work-items/**`).
- **AC9** Back-compat with current flat structure (no-status → `ready`).
- **AC10** Documentation updated (Delivery, Work Items, Create, Explain, Understand, Visual
  Guide) EN/ES.
- **AC11** Tests cover lifecycle and recursive discovery.
