# Spec: Work Item Delivery Workflow

## Acceptance Criteria

- **AC1** — There is an official Work Item delivery lifecycle (Roadmap → Work Item → Branch
  → Implementation → Scan → Ownership → Guard → Knowledge → Review → Commit).
- **AC2** — `kaddo understand` recommends the full lifecycle when a Work Item is active,
  with a suggested branch name and commit message.
- **AC3** — Git strategy includes branch-naming conventions.
- **AC4** — Guard appears explicitly in the flow ("before committing, run `kaddo guard`").
- **AC5** — Ownership appears explicitly in the flow.
- **AC6** — Docs reflect the new lifecycle.
- **AC7** — Examples include the updated flow.
- **AC8** — Kaddo still never creates branches/commits/merges automatically.
- **AC9** — Build and tests keep passing.

## Edge Cases

- No active Work Item → `understand` keeps its phase/next-steps output (no lifecycle block).
- Multiple active Work Items → show the lifecycle for the first one, list the others.
- Unknown Work Item type → default commit prefix `chore`.

## Validation

```bash
pnpm --filter "@kaddo/cli" test
pnpm -r build
```
