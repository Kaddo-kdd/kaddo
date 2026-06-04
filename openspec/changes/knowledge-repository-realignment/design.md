# Design: Knowledge Repository Realignment

## Layout mapping (before → after)

```txt
architecture/business/*.md            → knowledge/business/*.md
architecture/business/product-brief   → knowledge/product/product-brief.md
architecture/capabilities.md          → knowledge/product/capabilities.md
architecture/codebase-foundation.md   → knowledge/tech/codebase.md
architecture/stack.md                 ┐
architecture/standards.md             ├→ sections of knowledge/tech/codebase.md
architecture/git-strategy.md          │   (no longer separate bootstrap artifacts)
architecture/quality-attributes.md    ┘
architecture/current-state.md         → knowledge/tech/current-state.md
architecture/decision-candidates.md   → knowledge/tech/decision-candidates.md
architecture/adrs/ | decisions/       → knowledge/tech/decisions/
architecture/modules/                 → knowledge/tech/modules/
architecture/roadmap.md               → knowledge/delivery/roadmap.md
architecture/work-items/              → knowledge/delivery/work-items/
architecture/(history)                → knowledge/delivery/history/
```

Concept: **Decision = domain, ADR = format** → the folder is `decisions/`, the files are
ADRs.

## Single source of truth for paths

Add `packages/cli/src/core/layout.ts` exporting the knowledge root and per-layer/per-artifact
paths plus a resolver that falls back to legacy `architecture/` when `knowledge/` is absent:

```ts
export const KNOWLEDGE_DIR = 'knowledge'
export const LAYERS = ['business', 'product', 'tech', 'delivery'] as const
export const PATHS = {
  business: 'knowledge/business',
  product: 'knowledge/product',
  tech: 'knowledge/tech',
  delivery: 'knowledge/delivery',
  roadmap: 'knowledge/delivery/roadmap.md',
  workItems: 'knowledge/delivery/work-items',
  decisions: 'knowledge/tech/decisions',
  modules: 'knowledge/tech/modules',
  codebase: 'knowledge/tech/codebase.md',
  // …
}
export function knowledgeRoot(dir: string): string  // 'knowledge' or legacy 'architecture'
```

Every command (init, scan, context, understand, create, owners, guard, explain, bootstrap,
modules) reads paths from this module instead of hard-coded `'architecture'`. This makes the
refactor centralized and testable rather than 54 scattered edits.

## Bootstrap (reduced)

`kaddo bootstrap` generates only the minimal base:

```txt
knowledge/business/{problem,users,value-proposition,constraints,business-rules}.md
knowledge/product/{product-brief,capabilities}.md
knowledge/tech/codebase.md
```

It no longer generates `roadmap.md`, `work-items/` or `decisions/` — those appear later via
agents and project evolution. `assumptions.md`/`quality-checks.md` are sections, not files.

## Agents (updated targets)

| Agent | Saves to |
|---|---|
| business-agent | `knowledge/business/*` |
| bootstrap-agent | `knowledge/business/*`, `knowledge/product/*`, `knowledge/tech/codebase.md` |
| codebase-agent (was codebase-foundation-agent) | `knowledge/tech/codebase.md` |
| roadmap-agent | `knowledge/delivery/roadmap.md` |
| work-item-agent | `knowledge/delivery/work-items/` |
| capability-agent | `knowledge/product/capabilities.md` |
| architecture-agent | `knowledge/tech/current-state.md` |

## Context pack & explain (by layer)

Context pack and `kaddo explain` group knowledge by **Business / Product / Tech / Delivery**
instead of an architecture-grouped list, e.g.:

```txt
Business   ✓ problem  ✓ users
Product    ✓ product brief  ✓ capabilities
Tech       ✓ codebase
Delivery   ✗ roadmap  ✗ work items
```

## Templates

Re-categorize the registry into `business · product · tech · delivery · operations ·
legacy`. Tech absorbs stack/standards/git-strategy/quality-attributes as `codebase`
sections (kept available as standalone operations templates via `kaddo add`).

## Migration command

`kaddo migrate knowledge-layout`:

- detects a legacy `architecture/` layout,
- moves folders/files into `knowledge/` per the mapping,
- never overwrites (skips and reports),
- prints a report of moved/skipped/needs-manual (e.g. consolidations into `codebase.md`),
- is idempotent.

## Guard

No algorithm change — only the artifact root it scans (`knowledgeRoot(dir)`), which already
falls back to `architecture/`. `code:` globs are untouched.

## Phasing (to keep tests green)

1. `layout.ts` + backward-compatible `knowledgeRoot()`; route all readers through it.
2. Switch writers/bootstrap/templates/agents to `knowledge/` paths; update tests.
3. `kaddo migrate knowledge-layout` + tests.
4. Docs (manifesto macro flow → Business→Product→Tech→Delivery, homepage, visual guide,
   workflow, use-cases, templates, agents) EN/ES.
5. Examples migrated to `knowledge/`.

## Alternatives considered

- Flat `architecture/ → knowledge/` rename — rejected (loses the layer reorganization).
- No backward compatibility — rejected (breaks existing repos with no path forward).
- Keep stack/standards as separate bootstrap files — rejected (the layer model puts them in
  `tech/codebase.md`; they remain installable via `kaddo add`).
