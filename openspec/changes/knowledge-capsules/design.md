# Design: Knowledge Capsules

## core/capsule.ts
- `buildCapsule(dir, config)` extracts purpose (firstParagraph), capability headings, ADR titles,
  owners from knowledge/; leaves agent-completed sections as placeholders. Never reads source.
- `renderCapsuleMarkdown` / `serializeCapsuleJson`.
- `addExternalCapsule(dir, src)` (pure): copy to external/<id>.capsule.md + update .kaddo/external.yml.
- `loadExternalCapsules(dir)` → parseCapsule() summaries (purpose/capabilities/contracts/risks/age).

## commands/capsule.ts
- `runCapsuleExport` / `runCapsuleAdd` wrap the core fns with cwd + logging; registered under
  `kaddo capsule export|add` in index.ts.

## Surfaces
- ContextPack.external + `## External Knowledge` template section.
- ProjectExplanation.externalCapsules + `## External Knowledge Capsules: N` (+ >90d stale warning).
- understand prints external systems + review reminder.

## Agent
- capsule-agent prompt (9-section) + responsibility matrix + tech group.

## Compatibility
Additive. No existing behavior changes; external section only appears when capsules are imported.
