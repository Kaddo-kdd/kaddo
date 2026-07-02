# Tasks: Existing Capability Discovery for Pre-AI and Legacy (VS-074)

- [x] capability-agent prompt: state-aware modes (new/pre-ai/legacy), capability status values,
      evidence rule (no invented evidence), richer pre-ai/legacy output (Inventory + Gaps + Roadmap
      Candidate Signals; legacy criticality/change-risk/operational-dependency/modernization).
- [x] bootstrap-templates.ts: pre-ai/legacy `capabilities.md` evidence-backed inventory + gaps +
      candidate signals (legacy risk/modernization fields).
- [x] roadmap-agent prompt: capabilities.md as primary source; don't build from a placeholder.
- [x] work-item-agent prompt: recommend `related_capability`.
- [x] next-step.ts: discovery wording for pre-ai/legacy placeholder capabilities.
- [x] artifact-quality.ts: recognize inventory scaffolding (`Label:`, enum options, `<...>`) as
      placeholder so a fresh inventory template stays placeholder.
- [x] Tests: templates (pre-ai/legacy/new), capability-agent modes/status/evidence/gaps/signals,
      roadmap-agent primary-source, work-item related_capability, discovery wording (9 new).
- [x] Docs bootstrap.md (EN/ES) capability-discovery section; README. Minor bump 3.39.0.

## Validation
- [x] typecheck green; `pnpm test` green (704); `pnpm -r build` green; smoke (legacy template).
- [x] `astro build` green.
