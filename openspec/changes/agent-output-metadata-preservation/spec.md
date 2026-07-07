# Spec: Agent Output Metadata Preservation (VS-084)

## User Story

As a Kaddo user whose agents refine bootstrap-created knowledge files, I expect the YAML
frontmatter metadata to be preserved so the system can track provenance and detect drift.

## Problem

When agents rewrite knowledge files created by `kaddo bootstrap`, they may strip or alter
the YAML frontmatter (`type`, `generated_by`, `template_version`). There was no mechanism
to instruct agents to preserve metadata, and no way to detect when metadata drifted.

## Solution

1. **Frontmatter Rules in agent prompts**: Agents that refine knowledge files automatically
   receive a `## Frontmatter Rules` section via `withResponsibilityTrace`. Rules instruct
   agents to preserve `type`, `generated_by`, `template_version`, set `project_state:
   ai-assisted` after refinement, and add `refined_by` with the agent name.

2. **Metadata health analyzer**: A new `analyzeMetadataHealth` function in
   `packages/cli/src/core/metadata-health.ts` parses frontmatter of knowledge files and
   detects missing required fields and `project_state` inconsistencies.

3. **Integration**: Metadata health is surfaced in context-pack (JSON + MD), understand
   (markdown + terminal), explain (human + agent), and guard output.

4. **Independence**: Content quality (`artifact-quality.ts`) remains independent of metadata
   health. A file with useful content but drifted metadata is still classified as useful.

## Acceptance Criteria

- **AC1–AC10** — `analyzeMetadataHealth` correctly detects missing fields, inconsistencies,
  handles files with no frontmatter, and counts healthy/drifted files.
- **AC11–AC15** — `renderFrontmatterRules` returns rules for knowledge-refining agents only;
  `withResponsibilityTrace` includes frontmatter rules for those agents.
- **AC16–AC17** — `context-pack.json` includes `metadataHealth` field.
- **AC18** — Content quality is independent of metadata health.
- **AC19–AC20** — CLI does not call LLM or execute git.
- **AC21–AC22** — Docs EN/ES updated.
- **AC24–AC28** — Tests, typecheck, build CLI/MCP/docs pass.

## Files Changed

- `packages/cli/src/agents/responsibility.ts` — added `renderFrontmatterRules`, `KNOWLEDGE_REFINING_AGENTS`, wired into `withResponsibilityTrace`
- `packages/cli/src/core/metadata-health.ts` — new metadata health analyzer
- `packages/cli/src/core/context-pack.ts` — added `metadataHealth` to `ContextPack` type and `buildContextPack`
- `packages/cli/src/core/understand.ts` — added `metadataHealth` to `UnderstandPlan` and `enrichUnderstandPlan`
- `packages/cli/src/core/project-explain.ts` — added `metadataHealth` to `ProjectExplanation` and `buildProjectExplanation`
- `packages/cli/src/templates/context-pack-template.ts` — metadata health warnings in Missing Context
- `packages/cli/src/templates/understand-template.ts` — metadata health in markdown and terminal
- `packages/cli/src/commands/understand.ts` — wires `analyzeMetadataHealth` into enrichment
- `packages/cli/src/commands/guard.ts` — metadata health warnings in guard output
- `packages/cli/tests/metadata-health.test.ts` — 18 tests
- `apps/docs/src/content/docs/commands/understand.md` — EN docs
- `apps/docs/src/content/docs/es/commands/understand.md` — ES docs
