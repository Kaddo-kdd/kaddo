# Design: Bootstrap Minimal Artifacts & Agent Groups

## Consolidated bootstrap artifacts

Bootstrap generates exactly three files:

| File | Template | Sections |
|---|---|---|
| `knowledge/business/business.md` | `business` (new) | Problem · Users · Value Proposition · Business Rules · Constraints · Assumptions · Open Questions · Quality checklist |
| `knowledge/product/product.md` | `product` (new) | Product Brief · Capabilities · Scope · Out of Scope · Success Criteria · Assumptions · Open Questions · Quality checklist |
| `knowledge/tech/codebase.md` | `codebase` (expanded) | Repository Structure · Candidate Stack · Quality Attributes · Development Standards · Git Strategy · Initial Modules · Assumptions · Open Questions · Quality checklist |

The specialized templates (`business-problem`, `business-users`, …, `capabilities`,
`business-product-brief`, `quality-attributes`) remain in the registry as **advanced**
templates (a `advanced: true` flag) — surfaced when knowledge is refined, never generated
by bootstrap.

## Progressive growth

`business.md` can later split into `problem.md`, `users.md`, … and `product.md` into
`product-brief.md`, `capabilities.md`. Kaddo does not force that structure at the start.

## Agent groups

A single source of truth maps each agent to a layer group:

```ts
const AGENT_GROUPS = {
  business: ['business-agent'],
  product: ['bootstrap-agent', 'capability-agent'],
  tech: ['architecture-agent', 'codebase-agent', 'stack-agent', 'security-agent',
         'standards-agent', 'module-design-agent', 'adr-agent'],
  delivery: ['roadmap-agent', 'work-item-agent', 'git-strategy-agent'],
  utilities: ['legacy-agent'],
}
```

### Recommended install by project state

- **new** → business-agent, bootstrap-agent, codebase-agent, roadmap-agent, work-item-agent
- **pre-ai** → capability-agent, architecture-agent, roadmap-agent, work-item-agent
- **legacy** → legacy-agent, architecture-agent, capability-agent, roadmap-agent, work-item-agent

### `kaddo add agents` behavior

- `kaddo add agents` → install the recommended set for the project's state (reads
  `.kaddo/config.yml`); always includes the agents README.
- `kaddo add agents --all` → install every agent (the previous behavior).
- `kaddo add agents --group <business|product|tech|delivery|utilities>` → install one group.
- No-overwrite preserved; already-installed agents reported as skipped.

Implementation: special-case `agents` in `runAdd` (or a dedicated path) that selects the
agent files to write based on the flags/state, instead of always writing all
`AGENT_PROMPTS`. The agent group map + selection live in `src/agents/groups.ts` for reuse
by `understand`.

## understand (contextual)

`kaddo understand` recommends agents based on `projectState` + the current layer (derived
from which `knowledge/<layer>/` artifacts exist) + which agents are already installed.
Example output:

```
Current phase: Product
Recommended agents:
- bootstrap-agent
- capability-agent
```

## Docs

- Manifesto: add "Knowledge grows progressively" — not all knowledge must exist at the
  start.
- Bootstrap pages: show `business.md`, `product.md`, `codebase.md` as the starting point.
- Agents page: new "Agent groups" section (Business/Product/Tech/Delivery/Utilities) +
  `--all` / `--group`.
- Visual Guide: show how artifacts and agents appear during evolution.

## Alternatives considered

- Delete specialized templates — rejected (lose future capability; user's modification).
- Keep installing all agents — rejected (the symptom we are fixing).
- A separate `kaddo agents` command — rejected (keep `kaddo add agents`, extend with flags).
