# Tasks: Agent Readiness Gate for Open Questions (VS-064)

## Phase 1 — Core
- [x] `core/open-questions.ts`: extract (EN/ES), `classifyQuestion`, `buildOpenQuestionsReport`,
      readiness, suggested assumptions, Markdown/JSON renderers, `roadmapReadinessSummary`.

## Phase 2 — CLI
- [x] `commands/questions.ts`; `questions` + `readiness` commands; command-help entry.
- [x] `understand` nudge when blocking questions exist.

## Phase 3 — Agents
- [x] Readiness Gate in roadmap-agent, work-item-agent, implementation-agent, bootstrap-agent prompts.

## Phase 4 — MCP
- [x] `generateQuestionsReport`; `kaddo://open-questions` + `kaddo://roadmap-readiness` resources;
      `kaddo_generate_questions_report` tool (only `.kaddo/reports/`).

## Phase 5 — Docs & tests
- [x] New Open Questions Gate page (EN/ES) + sidebar; Commands Overview + MCP Server cross-links;
      README.
- [x] CLI tests (extraction, classification, readiness, markdown/JSON); MCP tests (resources, tool,
      no-escape writes).

## Validation
- [x] `pnpm test` green (589); typecheck green; `pnpm -r build` green; smoke `kaddo questions`.
- [x] `astro build` green.
