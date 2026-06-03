# Design: Project Knowledge Bootstrap

## Layers

`kaddo bootstrap` materializes four base layers as knowledge artifacts:

```txt
Business → Architecture → Codebase → Development
```

| Layer | Artifacts |
|---|---|
| Business | `architecture/business/{product-brief,problem,users,value-proposition,business-rules,constraints,glossary}.md` |
| Architecture | `architecture/{capabilities,quality-attributes,stack,current-state,decision-candidates}.md` + `architecture/adrs/ADR-0001-initial-architecture.md` |
| Codebase | `architecture/{codebase-foundation,standards,git-strategy}.md` |
| Development | `architecture/roadmap.md` + `architecture/work-items/` |

Plus a `architecture/bootstrap-summary.md` index of what was created and the next step.

## Command

`kaddo bootstrap`:

1. Requires `.kaddo/config.yml` (else: `Run 'kaddo init' first.`).
2. Loads config; reads `project.state`.
3. If state is not `new`, warns and asks for confirmation before continuing.
4. Generates the artifacts above **from the template registry**, never overwriting
   existing files (reported as skipped).
5. Ensures `architecture/work-items/` exists.
6. Prints a per-layer summary and the recommended next step (`kaddo context` + agents).

Deterministic: no LLM, no source code, no architecture decisions. A pure `bootstrap(dir)`
returns `{ written, skipped }` for testing; `runBootstrap` wraps it with prompts.

## Templates (registry)

New `business` category, plus architecture-category additions:

| id | category | outputPath |
|---|---|---|
| `business-product-brief` | business | `architecture/business/product-brief.md` |
| `business-problem` | business | `architecture/business/problem.md` |
| `business-users` | business | `architecture/business/users.md` |
| `business-value-proposition` | business | `architecture/business/value-proposition.md` |
| `business-rules` | business | `architecture/business/business-rules.md` |
| `business-constraints` | business | `architecture/business/constraints.md` |
| `business-glossary` | business | `architecture/business/glossary.md` |
| `quality-attributes` | architecture | `architecture/quality-attributes.md` |
| `codebase-foundation` | architecture | `architecture/codebase-foundation.md` |
| `bootstrap-summary` | architecture | `architecture/bootstrap-summary.md` |

Each carries purpose, when-to-use, minimal sections, Assumptions, Open questions and a
`## Quality checklist`. Existing templates (`capabilities`, `stack`, `current-state`,
`decision-candidates`, `standards`, `git-strategy`, `roadmap`, `adr`) are reused.

## Agents

Add three prompt packs (each with the standard 9 sections incl. Quality Checklist):

- `business-agent` → refine `architecture/business/*.md`.
- `bootstrap-agent` → drive Business → Architecture → roadmap/work items;
  save `architecture/bootstrap-summary.md`, `capabilities.md`, `roadmap.md`.
- `codebase-foundation-agent` → propose a codebase foundation coherent with business,
  architecture and candidate stack; **must not write production code**.

## No-overwrite & edge cases

- Not initialized → error, exit 1.
- Not `new` → warn + confirm; proceed only on yes.
- Existing artifact → skipped, never overwritten; rest of the flow continues.
- Insufficient input → templates ship with `TBD`/assumptions/open questions, never invented
  content.

## Relation to the loop

After `bootstrap`: `kaddo context` → `kaddo add agents` → `kaddo understand` → refine with
LLM agents → `kaddo create --from roadmap` → `owners suggest` → `guard` → `explain`.

## Alternatives considered

- Generate boilerplate/code — rejected for this VS (knowledge first; technical base later).
- Inline strings instead of registry — rejected (keep one source of truth).
- Auto-fill content — rejected (Kaddo never invents business facts).
