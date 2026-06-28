# Tasks: Adapter Discovery and Status (VS-070)

- [x] core/codex-adapter.ts: centralize `ADAPTERS` catalog + `findAdapter`; `AdapterState`,
      `classifyAdapterState` (refines detectAgentsState, distinguishes legacy markers),
      `parseOriginAdapter`, `buildAdapterStatuses`, `buildSharedFileStatuses`.
- [x] commands/adapters.ts: install derives target from `ADAPTERS`; add `runAdaptersList` (catalog,
      `--json`, no project) and `runAdaptersStatus` (per-adapter state + recommended actions +
      shared_files, `--json`). Read-only.
- [x] index.ts: register `adapters list` (alias ls) and `adapters status` (alias check).
- [x] Tests: list text+json; status missing/team-owned/injected/legacy-injected/full-generated/
      broken-markers; recommended actions; shared AGENTS.md origin; json shape; no file/knowledge/
      .kaddo writes (11 cases).
- [x] Docs EN/ES (Custom Adapters: discovery & status, state table, shared AGENTS.md, force vs inject)
      + README adapters block. Minor bump to 3.32.0.

## Validation
- [x] typecheck green; `pnpm test` green; `pnpm -r build` green; smoke (list/status text+json).
- [x] `astro build` green.
