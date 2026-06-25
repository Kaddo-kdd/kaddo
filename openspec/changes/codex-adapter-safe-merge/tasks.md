# Tasks: Codex Adapter Safe Merge (VS-065.2)

- [x] core/codex-adapter.ts: markers, `detectAgentsState`, `renderKaddoBlock`, `injectKaddoBlock`
      (append/update, preserve outside markers, throw on half-open block).
- [x] commands/adapters.ts: `--inject` mode (create when missing, inject/update, dry-run, invalid
      error); keep default skip and `--force` overwrite.
- [x] index.ts: register `--inject` on `adapters install` and `export`.
- [x] Tests: block & markers, state classification, inject append + preserve, update no-dup, invalid
      throws; command-level inject/update/dry-run/invalid/no-knowledge-write (22 in file).
- [x] Docs EN/ES (Codex Adapter page) + npm README roadmap. Both packages bump to 3.27.2.

## Validation
- [x] typecheck green; `pnpm test` green; `pnpm -r build` green; smoke (inject + idempotency).
- [x] `astro build` green.
