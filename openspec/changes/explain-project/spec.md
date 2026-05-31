# Spec: Explain Project

## User Story

As a Kaddo user, I want to ask Kaddo to explain the current project, so that I can quickly
understand what is known, what is missing and what should happen next.

## Expected Behavior

When the user runs `kaddo explain` (without filters), Kaddo summarizes the current project
knowledge.

## Acceptance Criteria

### AC1 — Requires initialized project
If `.kaddo/config.yml` does not exist, show:
`No .kaddo/config.yml found. Run \`kaddo init\` first.`

### AC2 — Includes project metadata
Project name, state, team size, repository structure.

### AC3 — Includes technical inventory
If `.kaddo/scan.json` exists, includes detected stack and technical signals.

### AC4 — Includes knowledge status
Reports whether inventory, capabilities, architecture baseline, roadmap, work items and
ownership exist.

### AC5 — Includes roadmap summary
If `architecture/roadmap.md` exists, references it.

### AC6 — Includes work item summary
Includes existing Work Items and their status if available.

### AC7 — Includes ownership coverage
Reports how many Work Items declare `code:` ownership.

### AC8 — Includes missing knowledge
Lists missing knowledge artifacts and recommended next steps.

### AC9 — Supports `--for human`
Human mode outputs a readable markdown-style explanation.

### AC10 — Supports `--for agent`
Agent mode outputs compact structured data (JSON).

### AC11 — No LLM execution
The command must not call an LLM or require an API key.

### AC12 — Tests exist
Cover: uninitialized project, init only, scan, roadmap, work items, ownership coverage, human
output, agent output, missing-knowledge next steps, and that no source code is loaded.

## Edge Cases

- **No scan baseline** — recommend `kaddo scan`.
- **No roadmap** — recommend roadmap-agent.
- **No work items** — state that none exist yet.
- **Work items without ownership** — recommend `kaddo owners suggest`.
- **Context pack but no capabilities** — recommend capability-agent.

## Output Example

```txt
# Project Explanation

## Project
- Name: dotear-web
- State: pre-ai
- Team: indie
- Structure: monorepo

## Detected Stack
- Language: TypeScript
- Framework: Next.js
- Package manager: npm
- Migrations: supabase/migrations
- Infrastructure: amplify.yml

## Knowledge Status
- Inventory: available
- Capabilities: missing
- Architecture baseline: missing
- Roadmap: available
- Work items: 2
- Ownership coverage: 1/2 work items

## Suggested Next Steps
1. Use capability-agent to create architecture/capabilities.md.
2. Use architecture-agent to create architecture/current-state.md.
3. Run `kaddo owners suggest` for Work Items without code ownership.
```

## Validation

Run `pnpm test`, `pnpm build`, `kaddo explain`, `kaddo explain --for human`,
`kaddo explain --for agent`. Confirm no LLM is called and the output is useful.
