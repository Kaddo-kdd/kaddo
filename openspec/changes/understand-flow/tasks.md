# Tasks: Understand Flow

## Implementation Tasks

- [x] Create OpenSpec change for `understand-flow`.
- [x] Add `core/understand.ts` (state-aware plan builder).
- [x] Add `templates/understand-template.ts` (terminal + file rendering).
- [x] Add `kaddo understand` command.
- [x] Register command in CLI index.
- [x] Read validated `.kaddo/config.yml`.
- [x] Detect project state.
- [x] Check whether `.kaddo/scan.json` exists.
- [x] Reuse context pack generation (`buildContextPack`).
- [x] Check whether `architecture/agents/` and recommended agents exist.
- [x] Build state-aware recommended flow (agent → expected output).
- [x] Print concise handoff instructions.
- [x] Generate `.kaddo/understand.md`.
- [x] Ensure no LLM is called.
- [x] Ensure command works on Windows paths.

## Tests

- [x] Uninitialized project behavior.
- [x] Missing scan baseline behavior.
- [x] Missing agents behavior.
- [x] New project recommended flow.
- [x] Pre-ai recommended flow.
- [x] Legacy recommended flow.
- [x] `.kaddo/understand.md` generation.
- [x] Output includes CLI vs LLM responsibility.

## Documentation

- [x] Update README with `kaddo understand`.
- [x] Add docs page for `understand`.
- [x] Explain difference between `scan`, `context` and `understand`.
- [x] Explain that Kaddo does not execute LLMs.
- [x] Show workflow for new / pre-AI / legacy projects.

## Validation

- [x] Run tests.
- [x] Run build.
- [ ] Run `kaddo understand` manually in a sample project.
- [ ] Confirm it recommends capability-agent first for pre-ai (manual).
