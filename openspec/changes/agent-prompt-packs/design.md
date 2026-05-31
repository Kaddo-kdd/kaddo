# Design: Agent Prompt Packs

## Technical Approach

Agent prompt packs are embedded as Markdown string content inside the CLI package (the same
pattern used by existing modules — survives tsup bundling) and copied into the user project
when the `agents` module is installed.

```txt
src/agents/prompts.ts          # AGENT_PROMPTS: { fileName, content }[]
src/modules/agents.ts          # agents module installs README + the 5 prompt packs
src/commands/add.ts            # require config, partial install, safe overwrite
```

Installed project structure:

```txt
architecture/agents/
  README.md
  capability-agent.md
  architecture-agent.md
  roadmap-agent.md
  legacy-agent.md
  adr-agent.md
```

`architecture/agents/` is preferred over `.kaddo/agents/` because agents are part of the
project knowledge workflow and should be visible and versioned.

Existing files are never overwritten silently: `runAdd` writes only files that do not
exist, reports kept files, and supports partial (re)installation.

## Agent Contract

Each agent prompt includes these sections:

```
# <Agent Name>
## Role
## When to Use
## Input Required
## Expected Output
## Instructions
## Constraints
## Output Format
## Where to Save the Result
## Quality Checklist
```

## Base Agents

- **capability-agent** → `architecture/capabilities.md` — capabilities, modules, domains,
  risks, open questions, ownership, candidate code globs.
- **architecture-agent** → `architecture/current-state.md`, `architecture-notes.md`,
  `decision-candidates.md` — structure, modules, dependencies, integrations, data stores,
  infra, implicit decisions, open questions.
- **roadmap-agent** → `architecture/roadmap.md` — initiatives, related capabilities,
  impact, risk, dependencies, suggested order, candidate work items.
- **legacy-agent** → `architecture/legacy/{risks,unknowns,modernization-candidates}.md` —
  unknowns, risky areas, dependencies, modernization candidates, safe first steps.
- **adr-agent** → `architecture/decision-candidates.md` — candidate decisions with context,
  alternatives, risk, affected areas, validation needed (never final ADRs).

## State-Aware Guidance

- **new** → roadmap-agent → architecture-agent
- **pre-ai** → capability-agent → architecture-agent → roadmap-agent
- **legacy** → legacy-agent → architecture-agent → capability-agent → roadmap-agent

## CLI Behavior

`kaddo add agents`:

1. Require `.kaddo/config.yml` (else "run `kaddo init` first").
2. Create `architecture/agents/` if missing.
3. Copy base prompt files that do not already exist.
4. Print a tailored next-step handoff (run context → paste into LLM → use an agent).

## Alternatives Considered

- **Execute agents from CLI** — rejected: no provider dependency / API keys in this VS.
- **Install agents by default during init** — rejected: agents are optional.
- **Store agents in `.kaddo/agents`** — rejected: `architecture/agents/` is part of the
  versioned knowledge workflow.

## Risks & Mitigation

- Prompt packs too long → keep structured and concise.
- Output varies across LLMs → strict output formats + quality checklists.
- Users unsure where to save output → "Where to Save the Result" in each agent.
- Users think Kaddo runs agents → README and docs clarify CLI vs LLM responsibilities.
