# Spec: Unified Knowledge Artifact Discovery

## Discovery service
- One official implementation: `services/knowledge-artifacts.ts`
  (`discoverKnowledge`, `discoverWorkItems`, `isWorkItemArtifact`).
- Recursive Work Item discovery across lifecycle subfolders.
- Front-matter aware; priority front matter → path → name.
- Classifies layer; resolves Work Item lifecycle.

## Consumers
- explain, context, understand, owners suggest, guard and delivery helpers consume the service.

## Messaging
- When an artifact cannot be used, the command states why (e.g. all already owned / none found
  recursively) instead of "No knowledge artifacts found".

## Out of scope
- Structure changes, new artifacts, new commands, MCP, automation.

## Acceptance criteria
- **AC1** One official discovery implementation exists.
- **AC2** Explain uses it.
- **AC3** Context uses it.
- **AC4** Understand uses it (via explain/delivery).
- **AC5** Owners suggest uses it.
- **AC6** Guard uses it.
- **AC7** Work Items are discovered recursively.
- **AC8** Error messages explain why an artifact was ignored.
- **AC9** Discovery uses front matter when available.
- **AC10** Documentation describes the unified model (EN/ES).
- **AC11** Tests cover flat/subfolder, with/without front matter, draft/ready.
