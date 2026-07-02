# Tasks: Open Questions Source Locations and Resolution Guidance (VS-073.3)

- [x] core/open-questions.ts: parser captures `line` + `raw`; `OpenQuestion` gains `sourcePath`,
      `line`, `raw`, `note` (aliases of source/resolution_note); Markdown report shows `path:line` +
      suggested action block.
- [x] commands/questions.ts: per-question `Source`/`Status`/`Severity`/`Note` + copy/paste example for
      blocking open; localized (EN/ES) how-to-resolve guide. Never edits files.
- [x] core/next-step.ts: `questions` recommendation mentions source locations & resolution guidance.
- [x] MCP `kaddo://open-questions` inherits sourcePath/line/raw/note (serializes the report).
- [x] Tests: parser captures sourcePath/line/raw/note; JSON carries them; command output shows
      Source/Status/Severity + guide (4 new).
- [x] Docs open-questions.md (EN/ES) source-locations section; README. Minor bump 3.38.0.

## Validation
- [x] typecheck cli+mcp green; `pnpm test` green (695); `pnpm -r build` green; smoke (questions output).
- [x] `astro build` green.
