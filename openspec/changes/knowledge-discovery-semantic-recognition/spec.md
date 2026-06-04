# Spec: Knowledge Discovery & Semantic Recognition

## Acceptance Criteria
- AC1 — Consolidated Business (`type: business`) is recognized.
- AC2 — Consolidated Product (`type: product`) is recognized.
- AC3 — Capabilities detected by `type: capabilities` (any filename).
- AC4 — Current-state detected by `type: current-state`.
- AC5 — ADRs detected by `type: adr`/`decision`.
- AC6 — Work Items detected by work-item type (under delivery/work-items).
- AC7 — Explain stops depending on exact file names (uses discovery).
- AC8 — Understand recommends materializing Work Items when the roadmap has candidates.
- AC9 — Context includes knowledge maturity per layer.
- AC10 — Documentation updated.
- AC11 — Tests and build pass.

## Validation
```bash
pnpm --filter "@kaddo/cli" test
pnpm -r build
```
