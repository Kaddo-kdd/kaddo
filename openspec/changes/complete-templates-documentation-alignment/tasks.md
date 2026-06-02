# Tasks: Complete Templates & Documentation Alignment

## Implementation

- [x] Create OpenSpec change.
- [x] Review current inline templates and agent prompt outputs.
- [x] Create typed template registry (`src/templates/registry.ts`).
- [x] Core templates: work-item, roadmap, capabilities, knowledge.
- [x] Architecture templates: current-state, architecture-notes, decision-candidates, adr.
- [x] Module templates: module-design, module-stack, module-security, module-standards, module-adr.
- [x] Operations templates: security, standards, stack, git-strategy, incident, runbook.
- [x] Legacy templates: legacy-risks, legacy-unknowns, modernization-candidates.
- [x] Front matter in traceability templates.
- [x] Quality checklist in every template.
- [x] Ensure agent prompts align with template output paths.
- [x] No LLM calls.

## Tests

- [x] Registry includes all required templates by id.
- [x] Each template has id/name/category/outputPath/description/whenToUse/content.
- [x] Traceability templates include front matter.
- [x] Every template content includes a quality checklist.
- [x] Agent prompts reference their template output paths.

## Documentation

- [x] Templates overview page (EN/ES).
- [x] Core / Architecture / Module / Operations / Legacy template pages (EN/ES).
- [x] README Templates section.
- [x] Sidebar Templates group.
- [x] Clarify Minimum Sufficient Knowledge (guides, not forms).

## Validation

- [x] `pnpm --filter "@kaddo/cli" test`.
- [x] `pnpm -r build`.
