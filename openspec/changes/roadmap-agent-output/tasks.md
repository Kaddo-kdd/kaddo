# Tasks: Roadmap Agent Output

## Implementation Tasks

- [x] Review current `roadmap-agent.md`.
- [x] Update roadmap agent prompt to produce structured `architecture/roadmap.md`.
- [x] Add required roadmap sections.
- [x] Add candidate work item format.
- [x] Add guidance for new, pre-ai and legacy projects.
- [x] Add instruction to mark assumptions and open questions.
- [x] Add instruction to avoid code generation.
- [x] Add instruction to separate candidates from decisions.
- [x] Ensure roadmap agent references `.kaddo/context-pack.md`.
- [x] Ensure roadmap agent can use `architecture/capabilities.md` and `architecture/current-state.md` when available.

## Tests

- [x] Update agent prompt tests if they check required sections.
- [x] Test roadmap agent contains `architecture/roadmap.md`.
- [x] Test roadmap agent contains Candidate Work Items section.
- [x] Test roadmap agent contains assumptions/open questions guidance.
- [x] Test roadmap agent references Knowledge Levels.
- [x] Test roadmap agent references project states.

## Documentation

- [x] Update README with roadmap agent workflow.
- [x] Update docs for agents.
- [x] Update docs for `kaddo understand` if needed.
- [x] Add example roadmap output.
- [x] Explain that roadmap generation happens in the user's LLM chat.
- [x] Explain that roadmap candidates are not final Work Items yet.

## Manual Validation

- [ ] Run `kaddo context`.
- [ ] Run `kaddo add agents`.
- [ ] Use `roadmap-agent.md` with `.kaddo/context-pack.md` in an LLM.
- [ ] Confirm the LLM produces `architecture/roadmap.md`.
- [ ] Confirm the roadmap includes candidate work items.
- [ ] Confirm output can support future `kaddo create --from roadmap`.

## Validation

- [x] Run tests.
- [x] Run build.
