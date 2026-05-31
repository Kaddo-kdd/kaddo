# Tasks: Create From Roadmap

## Implementation Tasks

- [x] Review current `kaddo create` implementation.
- [x] Review roadmap-agent output format from VS-009.
- [x] Add parser for `architecture/roadmap.md`.
- [x] Define `RoadmapCandidateWorkItem` type.
- [x] Extract initiative metadata.
- [x] Extract candidate work items.
- [x] Preserve raw roadmap excerpt.
- [x] Extend `kaddo create` to accept `--from roadmap`.
- [x] Present candidate selection to the user.
- [x] Prefill Work Item fields from selected candidate.
- [x] Ask only for missing required fields.
- [x] Preserve source traceability in front matter.
- [x] Generate Work Item file using existing create conventions.
- [x] Keep existing create flows working.
- [x] Add helpful errors for missing roadmap or no candidates.
- [x] Ensure no LLM is called.

## Tests

- [x] Test parsing one roadmap candidate.
- [x] Test parsing multiple candidates.
- [x] Test parsing candidate under initiative.
- [x] Test missing roadmap behavior.
- [x] Test roadmap with no candidates.
- [x] Test generated Work Item includes source metadata.
- [x] Test missing type prompts or fallback behavior.
- [x] Test missing Knowledge Level fallback.
- [x] Test existing `kaddo create feature` still works.

## Documentation

- [x] Update README with `kaddo create --from roadmap`.
- [x] Update docs for `create`.
- [x] Update docs for roadmap workflow.
- [x] Add example roadmap candidate.
- [x] Add example generated Work Item.
- [x] Explain that roadmap candidates are not final Work Items until created.

## Manual Validation

- [ ] Generate `architecture/roadmap.md` using roadmap-agent.
- [ ] Run `kaddo create --from roadmap`.
- [ ] Select a candidate.
- [ ] Confirm generated Work Item contains roadmap context.
- [ ] Confirm front matter references roadmap source.
- [ ] Confirm Guard still works.

## Validation

- [x] Run tests.
- [x] Run build.
