# VS-082 — Tasks

- [x] Define `WorkItemSourceType` (10 values) and `WorkItemSource` type
- [x] Implement `parseWorkItemSource(frontmatter)` with inference logic
- [x] Implement `renderSourceCompact`, `summarizeWorkItemSources`, `renderSourcesSummary`
- [x] Manual creates emit `source: manual` in frontmatter
- [x] Roadmap creates emit `source: roadmap` + `source_id` + `source_title` + `source_context`
- [x] Add `rawFrontmatter` to `Artifact` type in artifact-reader
- [x] Wire source into context-pack (`ContextWorkItem.source`)
- [x] Wire source into context-pack template (render non-unknown sources)
- [x] Wire source into understand command and template
- [x] Wire source into project-explain (Work Item Sources summary section)
- [x] Wire source into project-route (`hasUnknownSources` → create-work-source warning)
- [x] Wire source into MCP (`WorkItemSourceMeta` in `WorkItemSummary`)
- [x] Write tests (21 tests covering parser, rendering, create, validation, backward compat)
- [x] EN/ES docs updated (commands/create.md)
- [x] Build CLI + MCP + Docs clean
