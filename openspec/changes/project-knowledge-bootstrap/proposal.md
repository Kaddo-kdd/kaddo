# Proposal: Project Knowledge Bootstrap

## Problem

After `kaddo init`, a new project has the base structure but no real definition yet:
no problem, users, value proposition, business rules, constraints, capabilities, initial
decisions, candidate architecture, roadmap or first Work Items. The repo exists but the
project has no memory or direction — and teams risk writing code before having criteria.

## Proposed Change

Add a `kaddo bootstrap` command that turns an initial idea into structured knowledge
**before** writing code, organized around Kaddo's base layers for `new` projects:

```txt
Business → Architecture → Codebase → Development
```

`bootstrap` is deterministic: it scaffolds **knowledge artifacts** from the template
registry (it never calls an LLM, never generates source code, never decides architecture).
Humans then refine the artifacts with the bootstrap agents in their own LLM.

## Why Now

Kaddo covers the evolution loop (`scan → context → understand → agents → roadmap → work
item → ownership → guard → explain`) well. For new projects, the missing piece is building
the **initial** knowledge base that makes that loop meaningful.

## Scope

- Add `kaddo bootstrap` (requires `kaddo init`; oriented to `state: new`).
- Generate business artifacts under `architecture/business/`.
- Prepare initial architecture artifacts (capabilities, quality-attributes, stack,
  current-state, decision-candidates, ADR-0001).
- Generate `architecture/codebase-foundation.md` (no source code).
- Prepare `architecture/roadmap.md` and `architecture/work-items/`.
- Use the template registry; add business + bootstrap templates.
- Add agents: `business-agent`, `bootstrap-agent`, `codebase-foundation-agent`.
- Update docs (EN/ES), README and the `new-project` example.

## Out of Scope

App scaffolding / boilerplate, editing package.json, installing frameworks, infrastructure,
calling LLMs, deciding architecture automatically, replacing human refinement, portals,
MCP, auto-generated diagrams, Jira/GitHub Issues integration, changing Guard.

## Expected Value

Kaddo becomes useful not only to understand existing projects but to **start** projects
from an idea, with a clear Business → Architecture → Codebase → Development progression and
versioned, minimum-sufficient knowledge.

## Risks

- Empty artifacts could feel like documentation theater → templates carry `TBD`,
  assumptions and open questions; refinement is an explicit agent step.
- Users might expect code generation → docs state clearly that bootstrap is knowledge-only.

## Success Criteria

`kaddo bootstrap` generates the initial knowledge base for new projects from official
templates, the four base layers are documented, existing files are never overwritten, no
LLM is called, no code is generated, and tests + build pass.
