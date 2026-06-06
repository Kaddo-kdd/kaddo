# Design: Work Item Type Expansion — chore

## Type model (`core/knowledge-levels.ts`)

- `WorkItemType = 'feature' | 'bugfix' | 'hotfix' | 'spike' | 'chore'`.
- `WORK_ITEM_TYPES` exported as the official catalog.
- `TYPE_TO_LEVEL.chore = 'K1'` (low ceremony: problem + expected result).
- `TYPE_ALIASES`: setup/maintenance/tooling/infrastructure/infra/refactor/config → `chore`.
- `normalizeType(raw)`: official type → alias → null. Single resolver reused by CLI + roadmap.

### Formal definition of chore

A Work Item is a `chore` when it does **not** add a functional capability, fix a defect, handle an
emergency or perform research — but is necessary for maintenance, configuration, tooling,
infrastructure or developer experience.

## create

- `resolveCandidateType` uses `normalizeType` for the candidate type and the CLI type, so `chore`
  and its aliases materialize without prompting.
- The standard `kaddo create <type>` path normalizes the CLI type too (aliases accepted).
- The interactive roadmap fallback offers `chore` as a选项.

## explain & context

- `explain` adds `workItems.byType` and a `## Work Items by Type` section (pluralized labels).
- `context` adds `deliveryMix` (active Work Items by type) and a `## Delivery Mix` section.
- Both count by the front-matter `type`; the context mix only counts ACTIVE items (consistent
  with VS-041).

## Agents

- roadmap-agent: emit only official types; use `chore` for technical/maintenance work.
- work-item-agent: preserve the candidate type; never upgrade a `chore` to a `feature`.

## Compatibility

Existing types remain valid; no existing Work Item is modified. `isValidType` now includes
`chore`. Module-defined types (adr/incident/…) are unaffected.
