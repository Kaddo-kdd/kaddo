# Design: Create From Roadmap

## Technical Approach

Extend the existing `kaddo create` flow to support a roadmap source. The command reads
`architecture/roadmap.md` and extracts candidate work items from the roadmap-agent format
introduced in VS-009.

## Command API

```bash
kaddo create --from roadmap          # preferred
kaddo create feature --from roadmap  # optional: type acts as a default/filter
```

The `create <type>` argument becomes optional (`create [type]`) so `--from roadmap` can run
without a type. Existing `kaddo create feature|bugfix|hotfix|spike` flows stay intact.

## Roadmap Input Format

The roadmap-agent produces candidate work items like:

```txt
### RM-001: Establish capability baseline

**Impact:** High
**Risk:** Low

**Candidate Work Items:**

- WI-CANDIDATE-001: Validate customer and points capabilities
  - type: spike
  - suggested knowledge level: K2
  - expected value: reduce ambiguity before further development
  - notes: validate with product owner
```

The parser extracts: candidate id, title, type, suggested knowledge level, expected value,
notes, parent initiative (id + title), and — when available — related capabilities, domain,
impact, risk, dependencies and open questions. The raw markdown excerpt is kept as fallback
context.

## Parser Strategy

A simple, deterministic line-based parser for v1 (no markdown AST):

1. Split the roadmap by initiative headings matching `### RM-001: <Name>`.
2. Within each initiative, collect initiative-level metadata (impact, risk, related
   capabilities, domain, dependencies, open questions).
3. Find the `**Candidate Work Items:**` section.
4. Parse list items beginning with `- WI-...:` as candidates.
5. Parse nested `- key: value` properties (type, suggested knowledge level, expected value,
   notes).
6. Keep the raw markdown excerpt per candidate as fallback context.

## Data Model

```ts
type RoadmapCandidateWorkItem = {
  id: string
  title: string
  type?: string
  suggestedKnowledgeLevel?: string
  expectedValue?: string
  notes?: string
  initiative?: { id?: string; title?: string }
  relatedCapabilities?: string[]
  domain?: string
  impact?: string
  risk?: string
  dependencies?: string[]
  openQuestions?: string[]
  rawMarkdown: string
}
```

## Work Item Output

Front matter keeps existing Kaddo conventions plus source traceability:

```txt
---
type: spike
id: WI-001
title: "..."
knowledge_level: K2
status: in-progress
domains: []
code: []
created_at: YYYY-MM-DD
source: roadmap
source_id: WI-CANDIDATE-001
source_initiative: RM-001
summary: "..."
---
```

> Note: `status: in-progress` is kept (instead of `proposed`) so `status`, `history` and
> `learn` continue to recognize the item.

Body includes Source, Problem, Expected Value, Context From Roadmap, Acceptance Criteria,
Notes, Open Questions, Definition of Done and Learning. The command still asks for required
fields that the candidate does not provide, based on the Knowledge Level.

## Interaction Flow

1. Verify the project is initialized.
2. Check `architecture/roadmap.md` exists.
3. Parse roadmap candidates.
4. If none found, show a helpful message.
5. Let the user select a candidate.
6. Confirm or edit Work Item type (ask if missing/unknown).
7. Confirm or edit Knowledge Level (infer from type or suggested level).
8. Ask only for missing required fields.
9. Generate the Work Item file.
10. Show the next step.

## Error Messages

- Missing roadmap: `No roadmap found at architecture/roadmap.md. Use roadmap-agent first or
  create a roadmap manually.`
- No candidates: `No candidate work items found in architecture/roadmap.md. Make sure your
  roadmap uses the Kaddo Roadmap Agent format.`

## Alternatives Considered

- **Create Work Items manually only** — rejected, duplicates roadmap context.
- **Parse any roadmap format** — rejected, v1 should be predictable.
- **Automatically create all Work Items** — rejected, user must stay in control.
- **Update roadmap status after creation** — deferred to a future VS.

## Risks and Mitigation

- Parser may fail if the roadmap format changes → keep the parser aligned with roadmap-agent
  output and preserve the raw excerpt inside the Work Item.
- Candidates may be vague → ask for missing required fields.
- Provide helpful error messages.
