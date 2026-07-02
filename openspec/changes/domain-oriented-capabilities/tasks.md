# Tasks: Domain-Oriented Capability Inventory (VS-074.1)

- [x] bootstrap-templates.ts: pre-ai/legacy `capabilities.md` → `## Capability Domains` (Domain →
      Capability), gaps/candidates name Domain + Related capability; legacy criticality/change-risk/
      operational-dependency/modernization per domain.
- [x] capability-agent prompt: Domain-Oriented Capability Inventory output + grouping rules (group by
      functional responsibility, not technical folders; capability may span layers).
- [x] roadmap-agent prompt: read capabilities as a domain map; candidates reference Domain.
- [x] work-item-agent prompt: recommend `related_domain` + `related_capability`.
- [x] next-step.ts: discovery wording "grouped by functional domains".
- [x] artifact-quality.ts: treat domain scaffolding (`<Domain name>`, bold labels, enums) as placeholder.
- [x] Tests: domain-oriented templates (pre-ai/legacy) + gap/candidate Domain; capability-agent domain
      rules; roadmap-agent domain map; work-item related_domain; artifact-quality fresh template = placeholder.
- [x] Docs bootstrap.md (EN/ES) domain wording; README. Patch bump 3.39.1.

## Validation
- [x] typecheck green; `pnpm test` green (707); `pnpm -r build` green; smoke (pre-ai domain template).
- [x] `astro build` green.
