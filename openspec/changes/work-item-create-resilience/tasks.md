# Tasks: Work Item Create Resilience and Acceptance Criteria UX (VS-085)

## Completed

- [x] Add ensureWorkItemsDir helper with config check
- [x] Replace all 3 directory checks (manual, module, roadmap) with ensureWorkItemsDir
- [x] Add collectAcceptanceCriteria iterative input flow
- [x] Add renderAcceptanceCriteria with semicolon parsing and checkbox normalization
- [x] Wire iterative acceptance criteria into manual create flow
- [x] Update buildFrontMatter with source.type, source.inferred, generated_by, template_version, work_type
- [x] Update acceptance criteria rendering in buildBody (checkbox format)
- [x] Update acceptance criteria rendering in buildRoadmapBody (checkbox format)
- [x] Fix existing roadmap test for new checkbox format
- [x] Write 16 VS-085 tests (criteria rendering, directory resilience, metadata, safety)
- [x] Run full test suite (881 tests passing)
- [x] Typecheck passes
- [x] Build CLI + MCP
- [x] Update docs EN/ES
- [x] Build docs
- [x] Create openspec
- [x] Version bump to 3.55.0
- [x] Commit, tag, push
