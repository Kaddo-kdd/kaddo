# Spec: Complete Templates & Documentation Alignment

## User Story

As a Kaddo user, I want complete templates for each knowledge artifact, so that I can
create consistent artifacts without inventing structure every time.

As a Kaddo agent user, I want agent outputs to match Kaddo templates, so that
LLM-generated artifacts fit into the CLI workflow.

## Acceptance Criteria

### AC1 — Template registry exists
A central module defines/exports all templates as typed data.

### AC2 — Core templates exist
`work-item`, `roadmap`, `capabilities`, `knowledge`.

### AC3 — Architecture templates exist
`current-state`, `architecture-notes`, `decision-candidates`, `adr`.

### AC4 — Module templates exist
`module-design`, `module-stack`, `module-security`, `module-standards`, `module-adr`.

### AC5 — Operations templates exist
`security`, `standards`, `stack`, `git-strategy`, `incident`, `runbook`.

### AC6 — Legacy templates exist
`legacy-risks`, `legacy-unknowns`, `modernization-candidates`.

### AC7 — Templates include guidance
Each template has id/name/category/outputPath/description/whenToUse/content and a
quality checklist in its content.

### AC8 — Front matter where useful
Traceability templates (work-item, adr, module-design, module-adr, incident) include
YAML front matter.

### AC9 — Agent prompts align with templates
Each operational/understanding agent prompt references its template's output path.

### AC10 — Documentation explains templates
Docs include pages listing available templates, when to use, related command, related
agent and output path.

### AC11 — No over-bureaucracy
Docs clarify templates are guides, not mandatory forms (Minimum Sufficient Knowledge).

### AC12 — EN/ES parity
Template documentation exists in English and Spanish.

### AC13 — Build and tests pass
`pnpm --filter "@trycatch.tv/kaddo" test` and `pnpm -r build` succeed.

## Validation

```bash
pnpm --filter "@trycatch.tv/kaddo" test
pnpm -r build
```
