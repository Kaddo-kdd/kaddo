# Proposal: Work Item Delivery Workflow

## Problem

The `todoApp` validation showed the real flow collapses to
`Roadmap → Work Item → Implementation → Commit`, skipping the operational steps that keep
knowledge and code evolving together:

1. No explicit **branch** step before starting.
2. **Guard** falls outside the natural flow (many changes commit without running it).
3. **Ownership** is not visible inside Work Item execution.
4. No clear recommendation to **scan** after significant changes.
5. The roadmap does not reflect progress (deferred to a later VS).

## Proposed Change

Define and reinforce the official **Work Item delivery lifecycle**, integrating Git
strategy, ownership, Guard and knowledge updates — **without** automating branches, commits
or merges:

```txt
Roadmap → Create Work Item → Git Strategy → Branch → Implementation → Scan →
Ownership → Guard → Knowledge Update → Review → Commit
```

- `kaddo understand` shows the full delivery lifecycle when a Work Item is active, with a
  suggested branch name and commit message.
- Git strategy agent/docs include branch naming + commit conventions.
- Guard and ownership appear explicitly inside the flow.
- Knowledge-update guidance (ADR / capabilities / current-state) after relevant changes.

## Out of Scope

Scaffold Agent, roadmap synchronization, MCP, portal, GitHub integration, auto-commit,
auto-branch, auto-merge. Kaddo never touches Git without human action.

## Success Criteria

There is an official Work Item delivery lifecycle; `understand` recommends it for active
Work Items; Git strategy covers branch conventions; Guard and ownership are explicit in the
flow; docs and examples reflect it; Kaddo still never runs branches/commits; tests + build
pass.
