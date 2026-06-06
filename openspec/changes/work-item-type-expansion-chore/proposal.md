# Proposal: Work Item Type Expansion — chore (VS-045)

## Why

Kaddo supported only `feature`, `bugfix`, `hotfix`, `spike`. Validating `todoApp`, the roadmap
produced candidates with `type: chore`, but `kaddo create --from roadmap` did not recognize it and
forced a manual type selection. Foundation work (Initialize TypeScript, Configure Vitest, Setup
CI, Update dependencies, Refactor structure) is not a functional capability — labeling it
`feature` distorts the meaning of Feature.

## What

Add **`chore`** as an official Work Item type for technical/maintenance/tooling/config/infra work,
plus optional aliases.

- `WorkItemType` gains `chore` (maps to Knowledge Level K1).
- Aliases `setup`, `maintenance`, `tooling`, `infrastructure`, `infra`, `refactor`, `config`
  resolve to `chore` (CLI and roadmap candidates).
- `kaddo create` and `kaddo create --from roadmap` accept `chore`/aliases without prompting.
- roadmap-agent and work-item-agent use `chore` for non-functional work and preserve the type.
- `explain` reports **Work Items by Type**; `context` reports an active **Delivery Mix** by type.
- Docs + examples (EN/ES) + the lifecycle diagram include `chore`.

The official catalog stays small and easy to understand:
`feature · bugfix · hotfix · spike · chore`. No new statuses, epics, releases, story points or
estimation.

## Impact

- Configuration/maintenance/enablement work is represented correctly instead of being forced into
  Feature. Existing types and Work Items are unchanged.
