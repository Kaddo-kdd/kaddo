# Tasks: ADR Materialization from Decision Candidates (VS-075)

- [x] core/decisions.ts: parse candidates (`##` headings), count ADRs by front-matter status,
      compute `tech_decisions` status + suggested ADR filenames; `hasUnmaterializedDecisions`.
- [x] commands/adr.ts + index.ts + command-help: `kaddo adr` (alias `decisions`, `--json`) — read-only
      handoff listing candidates + suggested ADR files. No writes, no accepted, no LLM, no git.
- [x] project-explain.ts: `techDecisions` + `## Tech Decisions` section (+ adr-writing recommendation).
- [x] context-pack.ts: `techDecisions` + Missing Context note when candidates without ADRs.
- [x] understand.ts: recommend adr-writing when candidates without ADRs.
- [x] agents/prompts.ts: work-item-agent (`related_decisions`/`decision_candidates` + warn) and
      implementation-agent (warn before implementing unformalized decisions).
- [x] skills/skills.ts: adr-writing formalized (statuses + Context/Options/Decision/Consequences/
      Related Capabilities/Related Work Items + materialize-from-candidates guidance).
- [x] Tests: parser, status none/candidates/draft-adrs/accepted-adrs, explain/context surfacing,
      `kaddo adr` read-only handoff, adr-writing skill format (9 new).
- [x] Docs Tech Decisions page (EN/ES) + sidebar; README. Minor bump 3.40.0.

## Validation
- [x] typecheck cli+mcp green; `pnpm test` green (716); `pnpm -r build` green; smoke (adr states).
- [x] `astro build` green.
