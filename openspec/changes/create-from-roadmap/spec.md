# Spec: Create From Roadmap

## User Story

As a Kaddo user, I want to create a Work Item from a roadmap candidate, so that I can move
from planning to execution without retyping context.

## Expected Behavior

When the user runs `kaddo create --from roadmap`, Kaddo reads `architecture/roadmap.md`,
lets the user select a candidate Work Item, and creates a real Work Item under
`architecture/work-items/`.

## Acceptance Criteria

### AC1 — Roadmap is required
If `architecture/roadmap.md` does not exist, Kaddo shows:
`No roadmap found at architecture/roadmap.md. Use roadmap-agent first or create a roadmap
manually.`

### AC2 — Candidate Work Items are parsed
Kaddo detects candidate work items in the roadmap-agent format.

### AC3 — User can select a candidate
If multiple candidates exist, Kaddo presents a selection list.

### AC4 — Work Item is prefilled
The generated Work Item uses roadmap data where available: title, type, suggested knowledge
level, expected value, notes, parent initiative, related capability/domain if available, and
a raw context excerpt.

### AC5 — Missing fields are requested
If required fields are missing for the selected Knowledge Level, Kaddo asks only for those
fields.

### AC6 — Source traceability is preserved
The Work Item front matter includes `source: roadmap`, `source_id: <candidate-id>` and
`source_initiative: <initiative-id>`.

### AC7 — Roadmap candidates are not auto-created in bulk
Kaddo only creates one Work Item per command execution.

### AC8 — No LLM execution
The command does not call an LLM.

### AC9 — Existing create behavior remains intact
`kaddo create feature`, `kaddo create hotfix`, etc. continue working.

### AC10 — Tests exist
Tests cover: missing roadmap, parsing roadmap candidates, candidate selection, work item
generation, source traceability, missing fields, and preserving existing create behavior.

## Edge Cases

- **Roadmap has no candidates** — show a helpful message explaining the expected format.
- **Candidate missing type** — ask the user to choose the Work Item type.
- **Candidate missing Knowledge Level** — infer from type if possible, otherwise ask.
- **Candidate has unknown type** — ask the user to map it to a supported Kaddo type.
- **Work Item file already exists** — use existing `create` file naming/sequencing behavior.

## Output Example

```txt
---
type: spike
id: WI-001
title: "Validate customer and points capabilities"
knowledge_level: K2
status: in-progress
domains: []
code: []
created_at: 2026-05-31
source: roadmap
source_id: WI-CANDIDATE-001
source_initiative: RM-001
summary: "Validate customer and points capabilities"
---

# Validate customer and points capabilities

> Type: spike · Level: K2

## Source

- Source: roadmap
- Candidate: WI-CANDIDATE-001
- Initiative: RM-001 — Establish capability baseline

## Expected Value

Reduce ambiguity before further development.

## Context From Roadmap

This candidate was created from the roadmap initiative RM-001.

## Notes

Validate with product owner.

## Definition of Done

- [ ] Required context has been captured.
- [ ] Work item has been reviewed.

## Learning
```

## Validation

Run `pnpm test`, `pnpm build`, `kaddo create --from roadmap`. Confirm a Work Item is created
from roadmap context with source traceability.
