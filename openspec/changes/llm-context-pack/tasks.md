# Tasks: LLM Context Pack

## Implementation Tasks

- [x] Review existing `explain --for agent` behavior.
- [x] Create `core/context-pack.ts` assembler (do not extend explain).
- [x] Create `kaddo context` command.
- [x] Read validated `.kaddo/config.yml` (require init).
- [x] Read `.kaddo/scan.json` when available.
- [x] Reference `architecture/inventory.md` when available.
- [x] Read `architecture/knowledge.md` when available.
- [x] Read `architecture/roadmap.md` when available.
- [x] Read metadata from `architecture/work-items/` and artifact front matter.
- [x] Generate `.kaddo/context-pack.json`.
- [x] Generate `.kaddo/context-pack.md`.
- [x] Add state-aware recommended agent handoff.
- [x] Add missing context section.
- [x] Avoid loading source code.
- [x] Avoid calling LLMs.
- [x] Add command to CLI index.
- [x] Ensure command works on Windows paths.

## Tests

- [x] Context pack generation with full project context.
- [x] Generation without scan.json.
- [x] Generation without inventory.md.
- [x] Generation with no work items.
- [x] Recommendations for `new`.
- [x] Recommendations for `pre-ai`.
- [x] Recommendations for `legacy`.
- [x] JSON output shape.
- [x] Markdown output shape.

## Documentation

- [x] Update README with `kaddo context`.
- [x] Update docs site with CLI → LLM handoff explanation.
- [x] Explain the difference between `scan`, `context` and future `understand`.
- [x] Clarify that Kaddo does not call an LLM.

## Validation

- [x] Run tests.
- [x] Run build.
- [ ] Run `kaddo context` in a sample project (manual).
- [ ] Confirm generated markdown is useful to paste into an LLM chat (manual).
