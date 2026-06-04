# Design: Work-item branch creation (agent config)

- Rejected: a `kaddo start` CLI command (the CLI must stay deterministic and not touch git).
- `work-item-agent` prompt gains a "## Delivery workflow" section: branch first (Git
  strategy), implement, scan, owners suggest, guard, knowledge update, commit only with
  human confirmation.
- `core/delivery.ts` keeps the lifecycle text (used by `kaddo understand`): step 1 is
  "Create a branch (per your Git strategy)" — performed by the implementing agent, not the
  CLI; commit step requires human confirmation. `branchNameFor` reads `.kaddo/git.yml`.
- Docs (workflow, visual guide, git-strategy, overview) and the new-project example reflect
  the agent-driven branch creation; the CLI never runs git.
