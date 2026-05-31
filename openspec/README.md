# OpenSpec for Kaddo

Kaddo is built around a simple belief: **knowledge should come before code**. This
folder applies that belief to Kaddo's own development.

Every relevant change to the CLI is defined, designed, specified and broken into tasks
**before** any code is written. This keeps changes traceable, reviewable and aligned
with the Kaddo manifesto — instead of going straight from `idea → prompt → code`.

## When to use OpenSpec

Use it for any change that:

- adds or modifies a command, flag or output
- changes the config model, work item model or artifact format
- introduces a new concept (context pack, agents, understand flow, etc.)
- affects how Guard, Scan, Create or Init behave

You do **not** need an OpenSpec change for: typo fixes, dependency bumps, README tweaks,
or trivial internal refactors with no observable behavior change.

## How to create a change

1. Pick a short, kebab-case `<change-id>` that names the outcome, e.g. `scan-baseline-artifact`.
2. Create the folder:

   ```
   openspec/changes/<change-id>/
     proposal.md
     design.md
     spec.md
     tasks.md
   ```

3. Copy the four templates from `openspec/templates/` into the new folder.
4. Fill them in order:
   - `proposal.md` — **why** the change exists and what it unlocks.
   - `design.md` — **how** it will be implemented and what it touches.
   - `spec.md` — the **observable behavior** and how we know it works.
   - `tasks.md` — the **concrete steps**, tests and docs to update.
5. Only after the four files are written, start implementing.

## Convention

```
openspec/
  README.md            ← this file
  templates/           ← copy these to start a new change
    proposal.md
    design.md
    spec.md
    tasks.md
  changes/             ← one folder per change
    <change-id>/
      proposal.md
      design.md
      spec.md
      tasks.md
```

## Lifecycle

A change moves through these states (tracked informally in `proposal.md` or via PR):

- **Draft** — being written, not yet ready to implement.
- **Ready** — all four files complete; implementation can begin.
- **In progress** — code is being written against `tasks.md`.
- **Done** — implemented, tested and merged.

Keeping completed changes in `changes/` gives Kaddo a living history of *why* each part
of the CLI exists — which is exactly the kind of knowledge Kaddo helps teams preserve.
