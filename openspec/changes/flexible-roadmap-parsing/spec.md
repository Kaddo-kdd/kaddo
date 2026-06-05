# Spec: Flexible Roadmap Parsing & Work Item Materialization

## Acceptance Criteria
- AC1 — The parser supports multiple roadmap formats.
- AC2 — Table-based roadmaps are recognized.
- AC3 — Bullet-based roadmaps are recognized.
- AC4 — Checklist-based roadmaps are recognized.
- AC5 — `create --from roadmap` works with all supported formats.
- AC6 — Explain distinguishes Roadmap Candidates vs Materialized Work Items (+ Remaining).
- AC7 — Understand recommends materializing candidates when appropriate.
- AC8 — Context pack exposes candidates and materialized counts.
- AC9 — Docs (EN/ES) updated.
- AC10 — Examples updated.
- AC11 — Tests cover all supported formats.
- AC12 — VS-010 candidate-style roadmaps keep working (back-compat).

## Validation
```bash
pnpm --filter "@kaddo/cli" test
pnpm -r build
```
