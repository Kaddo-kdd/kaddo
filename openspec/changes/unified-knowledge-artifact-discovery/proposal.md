# Proposal: Unified Knowledge Artifact Discovery (VS-046)

## Why

Validating `todoApp` exposed an inconsistency: `kaddo explain` reported `Materialized Work
Items: 1`, while `kaddo owners suggest` said `No knowledge artifacts found. Create a Work Item
first.` Both analyzed the same project but disagreed.

Root cause: `owners suggest` had its **own** non-recursive discovery (read only the flat
`knowledge/delivery/work-items/` directory), while explain/context/guard use the recursive
`readArtifacts`. After VS-041 moved Work Items into lifecycle subfolders (`draft/`, `ready/`, …),
owners stopped seeing them.

## What

Create a single source of truth for knowledge artifact discovery so every command shares one view.

- New `services/knowledge-artifacts.ts`: `discoverKnowledge(dir)` and `discoverWorkItems(dir)`,
  built on the shared recursive reader, front-matter aware, with layer + Work Item classification
  and lifecycle resolution.
- `owners suggest`, `explain`, `context`, `guard` and the delivery helpers all consume it.
- Work Item discovery is always **recursive** across lifecycle subfolders.
- More precise messages: when there is nothing to do, say why (e.g. "Found N Work Items; all
  already declare ownership", or "No Work Items found … searched recursively").

## Impact

- The cross-command inconsistency is gone — `owners suggest` now sees the same Work Items as
  `explain`. No structural changes, no migrations, existing artifacts untouched.
- Out of scope: new artifacts/commands, structure changes, MCP, automation.
