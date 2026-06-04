# Proposal: Bootstrap Minimal Artifacts & Agent Groups

## Problem

After VS-029, a freshly bootstrapped new project already generates eight knowledge files
(business/{problem,users,value-proposition,constraints,business-rules}.md,
product/{product-brief,capabilities}.md, tech/codebase.md) and `kaddo add agents` installs
**all** agents. Real use surfaced two symptoms with the same root cause — *the user does not
need all of that yet*:

1. Bootstrap creates too much knowledge too early ("more files than knowledge").
2. `add agents` installs too many agents too early ("more agents than needs").

This violates the **Minimum Sufficient Knowledge** principle: knowledge (and tooling)
should appear progressively as the project matures.

## Proposed Change

- **Bootstrap minimal**: `kaddo bootstrap` generates only three consolidated artifacts —
  `knowledge/business/business.md`, `knowledge/product/product.md`,
  `knowledge/tech/codebase.md` — each with the relevant sections (problem, users, …) as
  headings, not separate files.
- **Progressive growth**: the specialized templates (`problem`, `users`, `capabilities`,
  `product-brief`, …) stay in the registry as **advanced** templates that appear later when
  knowledge is refined. They are not deleted.
- **Agent groups**: organize agents by layer (Business / Product / Tech / Delivery /
  Utilities). `kaddo add agents` installs only the **recommended** set for the project
  state by default; add `--all` and `--group <name>`.
- **Contextual understand**: `kaddo understand` recommends agents by project state + current
  layer + existing artifacts.

## Why Now

VS-029 made the four layers real. The natural next step is to make the *arrival* of
knowledge and agents progressive, so Kaddo feels light at the start.

## Scope

- Consolidated `business` and `product` templates; expanded `codebase` template.
- Reduce bootstrap to the three consolidated artifacts.
- Agent group taxonomy + `add agents` default-by-state, `--all`, `--group`.
- `understand` contextual recommendations.
- Docs (EN/ES), examples, visual guide, manifesto note on progressive knowledge.

## Out of Scope

- Deleting specialized templates (kept as advanced).
- Auto-splitting consolidated files (future, agent-assisted).
- New project types; changes to Guard.

## Expected Value

A new project starts with three readable files and a handful of relevant agents; depth
appears as the project earns it.

## Risks

- Users expecting the old artifact set → docs explain progressive growth and how to refine.
- Group config drift → single source of truth for the agent→group map.

## Success Criteria

`kaddo bootstrap` generates exactly `business/business.md`, `product/product.md`,
`tech/codebase.md`; `kaddo add agents` installs the state-recommended agents by default and
supports `--all` / `--group`; `understand` recommends contextually; tests + build pass.
