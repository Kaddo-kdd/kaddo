# Design: Unified Knowledge Artifact Discovery

## Service: `services/knowledge-artifacts.ts`

```ts
type KnowledgeArtifact = Artifact & {
  relPath: string          // POSIX, relative to project root
  layer: 'business'|'product'|'tech'|'delivery'|'module'|'unknown'
  isWorkItem: boolean      // typed artifact under delivery/work-items/**
  lifecycle?: LifecycleState
}

discoverKnowledge(dir): KnowledgeArtifact[]   // the canonical catalog (recursive)
discoverWorkItems(dir): KnowledgeArtifact[]   // catalog filtered to Work Items
isWorkItemArtifact({ filePath, type }): boolean
```

Built on the existing recursive `readArtifacts` (which already skips invalid/absent front matter).
Discovery priority: **front matter (type) → known path/layer → file-name conventions**.

### Distinction: discovered vs eligible

- **Discovered** = exists physically and has valid front matter.
- **Eligible** = may participate in a specific operation (e.g. for ownership, a Work Item missing
  `code:` globs). Commands explain *why* a discovered artifact is not eligible instead of claiming
  nothing exists.

## Consumers (one implementation)

| Command | Before | After |
|---|---|---|
| owners suggest | own non-recursive reader (bug) | `discoverWorkItems` |
| explain | inline `readArtifacts().filter` | `discoverWorkItems` |
| context | inline `readArtifacts` | `discoverKnowledge` |
| guard | `readArtifacts` | `discoverKnowledge` |
| delivery helpers | inline `readArtifacts().filter` | `discoverWorkItems` |

## Supporting change

`artifact-reader` now also parses `capabilities` and `source` (needed by ownership), so the single
reader covers every consumer's fields.

## Compatibility

No structural changes, no migrations. Flat `work-items/*.md` and subfoldered items are both
discovered. Existing tests (flat layout) keep passing; new tests cover subfolders, draft/ready,
with/without front matter.
