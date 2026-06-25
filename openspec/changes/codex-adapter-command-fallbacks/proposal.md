# Proposal: Codex Adapter Command Fallbacks (VS-065.1)

## Why

After VS-065, Codex read `AGENTS.md` and followed the flow, but in some environments it reported
"`kaddo` is not in PATH" and either stopped or skipped steps (e.g. the readiness gate). The global
`kaddo` binary may be absent in sandboxes, Codex Cloud, fresh machines or pnpm-local setups even
though Kaddo is available via a local runner.

## What

Add a **Command fallback** section to the generated `AGENTS.md` so Codex tries the local project
runner before declaring Kaddo unavailable:

```bash
kaddo <command>                      # preferred
corepack pnpm exec kaddo <command>   # local runner
pnpm exec kaddo <command>
npx kaddo <command>                  # last resort
```

It instructs Codex not to conclude Kaddo is unavailable until the fallbacks are attempted, and to
mention briefly which fallback it used. The adapter only **documents** these — it never runs them.

## Scope

Only the Codex adapter output (`kaddo adapters install codex`, its `--dry-run`/`--force` and docs).
No package-manager runtime detection, no auto-execution, no package.json/npm-script changes, no MCP
or `kaddo questions/context` changes. Other adapters out of scope.

## Impact

- `core/codex-adapter.ts`: render a `## Command fallback` section.
- Docs EN/ES (Codex Adapter page) + npm README roadmap. Both packages bump to 3.27.1.
