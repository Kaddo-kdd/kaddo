# Design: Work Item Delivery Workflow

## Active Work Item detection

A Work Item is "active" when an artifact under `knowledge/delivery/work-items/` has
`status: in-progress` (same predicate as the explain parser). `understand` reads these
deterministically (no LLM).

## understand — delivery lifecycle

When an active Work Item exists, `kaddo understand` appends a **Work Item delivery
lifecycle** block (in addition to the phase/next-steps already shown):

```
Active work item: WI-001 — Add task reminders

Delivery lifecycle (Kaddo never runs git for you):
  1. Create a branch        e.g. feature/WI-001-add-task-reminders
  2. Implement the work item
  3. Run `kaddo scan`        (after new modules/migrations/contracts)
  4. Run `kaddo owners suggest`  → confirm code: globs
  5. Run `kaddo guard`       before committing (detect knowledge drift)
  6. Update knowledge        ADR / capabilities.md / current-state.md as needed
  7. Review (human)
  8. Commit                  e.g. feat(tasks): add task reminders
```

The branch name uses the Work Item id + slug; the commit suggestion uses a
Conventional-Commits prefix derived from the Work Item type
(feature→feat, bugfix→fix, hotfix→fix, spike→chore). These are **suggestions only**.

## Git strategy

The `git-strategy-agent` already proposes `{type}/{workItemId}-{slug}` branches and
`type(scope): message` commits. Docs add explicit branch-prefix and commit-type examples
and a "Before committing, run `kaddo guard`" note.

## Knowledge-update guidance

After relevant changes, recommend the right artifact:

| Change | Update |
|---|---|
| New architecture decision | ADR in `knowledge/tech/decisions/` |
| New capability | `knowledge/product/capabilities.md` |
| Significant structural change | `knowledge/tech/current-state.md` (reality) |

## Constraints

Kaddo never creates branches, commits or merges, and never modifies Git without human
action. All steps are recommendations / suggestions.

## Docs & examples

- Workflow: "Work Item Delivery Lifecycle" section.
- Visual Guide: delivery lifecycle diagram (Roadmap → … → Commit).
- Git strategy + ownership pages: Work Item integration.
- Examples: show the delivery lifecycle for a Work Item.
