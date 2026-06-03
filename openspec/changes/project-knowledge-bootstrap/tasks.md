# Tasks: Project Knowledge Bootstrap

## Implementation

- [x] Create OpenSpec change.
- [x] Add `business` template category.
- [x] Add business templates (product-brief, problem, users, value-proposition,
      business-rules, constraints, glossary).
- [x] Add quality-attributes, codebase-foundation, bootstrap-summary templates.
- [x] Add `kaddo bootstrap` command (requires init; warns when not `new`).
- [x] Generate business/architecture/codebase/development artifacts from the registry.
- [x] Ensure `architecture/work-items/` exists.
- [x] Preserve no-overwrite behavior (skipped reporting).
- [x] Add agents: business-agent, bootstrap-agent, codebase-foundation-agent.
- [x] Wire `--workspace`-style help text and command into index.ts.
- [x] No LLM, no source code generation.

## Tests

- [x] bootstrap fails without init.
- [x] bootstrap creates `architecture/business/` structure.
- [x] expected templates are created.
- [x] existing artifacts are skipped (not overwritten).
- [x] codebase-foundation.md is generated.
- [x] roadmap.md is generated (parser-compatible heading).
- [x] new agents have the required sections.
- [x] new templates exist in the registry.
- [x] existing tests stay green.

## Documentation

- [x] commands/bootstrap.md (EN/ES) + sidebar.
- [x] use-cases/new-project mentions bootstrap.
- [x] README + getting-started note bootstrap.
- [x] Visual/diagram of Business → Architecture → Codebase → Development.

## Validation

- [x] Run `pnpm --filter "@kaddo/cli" test`.
- [x] Run `pnpm -r build`.
