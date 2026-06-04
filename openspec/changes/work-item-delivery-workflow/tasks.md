# Tasks: Work Item Delivery Workflow

## Phase 1 — understand delivery lifecycle

- [ ] Detect active Work Items (under `delivery/work-items/`, `status: in-progress`).
- [ ] Add a delivery lifecycle helper (branch name + commit prefix from work-item type).
- [ ] `kaddo understand` prints the lifecycle when a Work Item is active.
- [ ] Tests.

## Phase 2 — docs & examples (EN/ES)

- [ ] Workflow: "Work Item Delivery Lifecycle" + Guard-before-commit + knowledge-update map.
- [ ] Visual Guide: delivery lifecycle diagram.
- [ ] Git strategy page: branch/commit examples.
- [ ] Ownership page: Work Item integration.
- [ ] Examples: show the delivery lifecycle.

## Validation

- [ ] `pnpm --filter "@kaddo/cli" test`
- [ ] `pnpm -r build`
