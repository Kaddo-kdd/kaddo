# Design: LLM Context Pack

## Technical Approach

Add a `kaddo context` command backed by a deterministic context assembler. It collects
structured project context from existing Kaddo artifacts and writes two outputs. It never
calls an LLM.

```txt
src/core/context-pack.ts
  buildContextPack(dir, now?): ContextPack            # assemble structured data
  serializeContextPackJson(pack): string              # JSON + trailing newline
src/templates/context-pack-template.ts
  renderContextPack(pack): string                     # markdown for LLM chat
src/commands/context.ts
  runContext(opts): void                              # read → build → write artifacts
```

The codebase is synchronous, so the assembler is synchronous too.

## Inputs

```txt
.kaddo/config.yml          # required — validated via core/config.ts
.kaddo/scan.json           # optional — scan baseline
architecture/inventory.md  # optional — human inventory
architecture/knowledge.md  # optional — current knowledge
architecture/roadmap.md    # optional — roadmap
architecture/work-items/   # optional — work item metadata (front matter only)
```

Missing files do not abort the command; their sections are marked as missing.

## Output Files

### `.kaddo/context-pack.json` (machine-readable)

```json
{
  "version": "1",
  "generatedAt": "ISO_DATE",
  "project": { "name": "", "state": "", "teamSize": "", "structure": "" },
  "scan": {
    "languages": [], "frameworks": [], "packageManagers": [],
    "sourceDirectories": [], "migrationDirectories": [],
    "contractFiles": [], "infrastructureFiles": []
  },
  "knowledge": {
    "summary": "", "roadmapSummary": "", "workItems": [], "artifacts": []
  },
  "missing": [],
  "handoff": { "recommendedAgents": [], "nextSteps": [], "instructions": [] }
}
```

### `.kaddo/context-pack.md` (human / LLM-friendly)

Sections: Project Metadata, Project State, Technical Inventory, Current Knowledge,
Roadmap, Existing Work Items, Artifacts and Ownership, Missing Context, Recommended Agent
Handoff, Instructions for the LLM.

## Context Selection Rules

Prefer config metadata, scan summary, front matter, summaries, artifact titles and work
item metadata. Avoid full source code, full historical artifacts, large diffs and blindly
dumping the entire `architecture/` folder.

## State-Aware Handoff

Recommended agents adapt to `project.state`:

- **new** → `roadmap-agent`, `architecture-agent`
- **pre-ai** → `capability-agent`, `architecture-agent`, `roadmap-agent`
- **legacy** → `legacy-agent`, `architecture-agent`, `capability-agent`

## Missing Context

If a required artifact is missing, the pack lists explicit notes, e.g. "No project
knowledge summary found yet.", "Scan baseline missing. Run `kaddo scan`.".

## CLI Flags

v1 supports `kaddo context`. Optional, only if trivial: `--format markdown|json` to write
just one output. Do not overbuild flags in this VS.

## Alternatives Considered

- **Extend `explain --for agent`** — rejected: `explain` answers "what is this project?",
  `context` prepares input for LLM agents. Different purpose.
- **Markdown only** — rejected: future commands benefit from JSON.
- **JSON only** — rejected: users need a pasteable chat-friendly artifact.

## Trade-offs

Two formats introduce duplication, but markdown serves humans/LLM chats and JSON serves
tooling/automation.

## Risks & Mitigation

- Pack too large → keep concise (metadata/summaries, not full content).
- Missing artifacts feel incomplete → mark missing context explicitly.
- Users expect interpretation → instructions clarify "use this with your LLM agent"; never
  claim semantic understanding.
