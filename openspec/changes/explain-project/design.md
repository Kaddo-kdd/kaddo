# Design: Explain Project

## Technical Approach

`explain` is a deterministic knowledge summarizer. It reuses existing readers (config,
artifact reader, scan baseline) and never calls an LLM.

A new pure module `core/project-explain.ts` gathers a `ProjectExplanation` from the project
directory; the command renders it (human markdown or agent JSON), prints it, and writes
`.kaddo/explain.md` + `.kaddo/explain.json`.

## Difference Between `context` and `explain`

- `kaddo context` **prepares input for an LLM agent** (external interpretation).
- `kaddo explain` **summarizes what Kaddo currently knows** (humans, maintainers, onboarding,
  agents needing quick state).

## Compatibility With Existing `explain`

The current command already supports `--scope`, `--type`, `--since` for focused artifact
explanations. Those keep working unchanged. The **default** invocation (no filter) now
produces the new project explanation. This avoids breaking existing behavior/tests.

## Inputs

```txt
.kaddo/config.yml      (required — project metadata)
.kaddo/scan.json       (optional — detected stack/signals)
.kaddo/context-pack.md (presence)
.kaddo/understand.md   (presence)
architecture/inventory.md     (presence)
architecture/capabilities.md  (presence)
architecture/current-state.md (presence)
architecture/roadmap.md       (presence)
architecture/agents/*.md      (presence)
architecture/work-items/*.md  (metadata via artifact reader)
```

Missing files become a "Missing Knowledge" section and drive "Suggested Next Steps".

## Data Model

```ts
type ProjectExplanation = {
  project: { name, state, teamSize, structure }
  stack: {
    language?, framework?, packageManager?,
    sourceDirectories[], migrationDirectories[], contractFiles[], infrastructureFiles[]
  } | null
  knowledge: {
    hasScan, hasInventory, hasContextPack, hasUnderstand,
    hasCapabilities, hasArchitecture, hasRoadmap, hasAgents
  }
  workItems: {
    total, inProgress, done, cancelled,
    items: { id, title, status, knowledgeLevel, hasOwnership, domains }[]
  }
  ownership: { workItemsTotal, workItemsWithOwnership, workItemsMissingOwnership }
  domains: string[]
  missingKnowledge: string[]
  suggestedNextSteps: string[]
}
```

## Output Modes

- `kaddo explain` / `--for human` → concise markdown explanation in the terminal + file.
- `kaddo explain --for agent` → compact structured JSON (the `ProjectExplanation`).

Recommended outputs (this VS): write both `.kaddo/explain.md` and `.kaddo/explain.json`.

## Human Output Structure

```txt
# Project Explanation
## Project
## Detected Stack
## Knowledge Status
## Roadmap
## Active Work Items
## Ownership Coverage
## Missing Knowledge
## Suggested Next Steps
```

## Suggested Next Steps Logic

- No scan → `Run \`kaddo scan\`.`
- Scan but no context pack → `Run \`kaddo context\`.`
- No agents → `Run \`kaddo add agents\`.`
- No capabilities → `Use capability-agent to generate architecture/capabilities.md.`
- No architecture baseline → `Use architecture-agent to generate architecture/current-state.md.`
- No roadmap → `Use roadmap-agent to generate architecture/roadmap.md.`
- No work items → `Create your first Work Item with \`kaddo create\`.`
- Work items missing ownership → `Run \`kaddo owners suggest\`.`

## Ownership Coverage

Summarize total Work Items, Work Items with `code:` ownership, and Work Items missing it.

## Alternatives Considered

- **Make explain a wrapper around context** — rejected; distinct purposes.
- **Call an LLM to summarize** — rejected; explain must be deterministic and provider-agnostic.
- **Load full artifacts** — rejected by default; use front matter + presence + light reads.

## Risks and Mitigation

- Too long → keep default concise; details live in the file outputs.
- Agent output duplicating context-pack → agent output is project-state focused, not raw
  context.
- Noisy on missing artifacts → present missing pieces as actionable next steps.
