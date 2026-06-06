# Tasks: Work Item Type Expansion — chore

## Phase 1 — Type model & create
- [x] knowledge-levels: `chore` type, `WORK_ITEM_TYPES`, aliases, `normalizeType`, K1 mapping.
- [x] create: normalize CLI + roadmap types (accept chore/aliases, no prompt); chore placeholder;
      roadmap fallback offers chore; updated messages + index description.

## Phase 2 — Surfaces
- [x] explain: `byType` + `## Work Items by Type`.
- [x] context: `deliveryMix` + `## Delivery Mix` (active by type).
- [x] agents: roadmap-agent emits chore; work-item-agent preserves type.
- [x] Tests (parsing, aliases, materialization, explain/context by type).

## Phase 3 — Docs & examples (EN/ES)
- [x] create, explain, overview docs; visual-guide lifecycle (types); new-project example.

## Validation
- [x] vitest run (403 passing)
- [x] build (cli + docs)
