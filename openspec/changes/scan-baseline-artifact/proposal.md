# Proposal: Scan Baseline Artifact

> Status: Ready

## Problem

`kaddo scan` detects useful technical information about a project, but that information
is not persisted as a reusable knowledge artifact. Today it is only written under a
`scan:` key in `.kaddo/config.yml`, which is not a good source for humans or LLM agents.

This creates a gap in the Kaddo flow:

```txt
scan → context → agents → understand
```

Without a baseline artifact, future LLM agent workflows have no stable input to analyze
the project.

## Proposed Change

Update `kaddo scan` so it generates two artifacts:

```txt
.kaddo/scan.json          # structured, for the CLI and future context-pack commands
architecture/inventory.md # readable, for humans and LLM chats
```

## Why Now

This change unlocks the next phase of Kaddo:

- LLM context packs (`kaddo context`)
- Capability extraction
- Architecture understanding
- Roadmap generation
- Legacy and pre-AI project analysis

It is the first real input for the Knowledge Driven Development flow.

## Scope

- Persist scan output as `.kaddo/scan.json`.
- Generate a human-readable `architecture/inventory.md`.
- Reuse the existing scanner result.
- Create required folders safely.
- Avoid unsafe overwrites of user-authored content.

## Out of Scope

- Capability detection.
- Architecture / roadmap / ADR generation.
- LLM execution or agent prompt packs.
- Semantic code analysis.
- Advanced domain inference (only deterministic suggestions).
- `kaddo context` and `kaddo understand` (later VS).

## Expected Value

`kaddo scan` becomes the first reusable input for the KDD flow — turning technical
detection into persisted project knowledge consumable by humans, the CLI and agents.

## Risks

- Generated artifacts may become verbose → keep the markdown concise.
- The JSON schema may churn → version it (`"version": "1"`).
- Markdown may duplicate config → markdown is the human/LLM surface, JSON is the tool surface.
- Overwriting could destroy user edits → JSON always regenerated, markdown overwrite is guarded.
