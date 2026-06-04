# Design: kaddo start

- `services/git.ts`: `currentBranch`, `branchExists`, `createOrSwitchBranch` (uses
  `git switch -c` / `git switch`; non-destructive).
- `core/delivery.ts`: `branchPattern` / `branchNameFor` read `.kaddo/git.yml`
  (`branchNaming.pattern`), substitute `{type}` (work-item type → feature/bugfix/hotfix/
  spike), `{workItemId}` / `{id}`, `{slug}`. `resolveStartTarget` picks the id or the single
  active Work Item.
- `commands/start.ts`: validates init + git repo, resolves the Work Item, warns when on
  `main`/`master`, creates/switches the branch, prints the delivery lifecycle. Never commits.
- Lifecycle/understand: step 1 is now `kaddo start`.
- Guarantee revised across docs: Kaddo creates the branch, never commits/pushes/merges.
