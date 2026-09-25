# Skills

Reusable **skill** definitions — capabilities shared across agents. A skill does not decide
WHAT to do (that is the agent); it defines HOW to do one thing well. Agents orchestrate;
skills standardize; knowledge grounds; MCP exposes.

Skills never execute anything — they are reusable instructions, not tools. They never run
git, never call an LLM and never modify files.

## Installed skills

- `adr-writing` (tech) — ADR Writing Skill. Applies to: decision-agent, architecture-agent, implementation-agent.
- `work-item-refinement` (delivery) — Work Item Refinement Skill. Applies to: work-item-agent, backlog-agent, roadmap-agent.
- `ownership-suggestion` (tech) — Ownership Suggestion Skill. Applies to: ownership-agent, work-item-agent, graph-agent, implementation-agent.
- `graph-metadata-review` (tech) — Graph Metadata Review Skill. Applies to: graph-agent, ownership-agent, work-item-agent.
- `capsule-writing` (integration) — Capsule Writing Skill. Applies to: capsule-agent, architecture-agent, product-agent.
- `learning-capture` (delivery) — Learning Capture Skill. Applies to: implementation-agent, guard-agent, architecture-agent, work-item-agent.
- `implementation-planning` (delivery) — Implementation Planning Skill. Applies to: implementation-agent, work-item-agent.
- `module-context-refinement` (tech) — Module Context Refinement Skill. Applies to: module-context-agent, architecture-agent.

## Groups

- **delivery**: work-item-refinement, implementation-planning, learning-capture
- **tech**: adr-writing, ownership-suggestion, graph-metadata-review, module-context-refinement
- **integration**: capsule-writing

Install: `kaddo add skills` (recommended), `--all`, or `--group <delivery|tech|integration>`.