# Spec: Work-item branch creation (agent config)

## Acceptance Criteria
- AC1 — The `work-item-agent` prompt includes a "Delivery workflow": branch first per the
  Git strategy, then implement, scan, owners suggest, guard, update knowledge.
- AC2 — The prompt states commits happen **only with explicit human confirmation**; never
  push/merge; the Kaddo CLI never touches git.
- AC3 — No CLI command performs git mutations.
- AC4 — `kaddo understand` delivery lifecycle reflects branch-first + commit-with-confirmation.
- AC5 — Docs/examples reflect the agent-driven protocol (no `kaddo start`).
- AC6 — Build and tests pass.

## Validation
```bash
pnpm --filter "@kaddo/cli" test
pnpm -r build
```
