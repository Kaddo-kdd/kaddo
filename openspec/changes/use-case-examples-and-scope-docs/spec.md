# Spec: Use Case Examples & Project Scope Documentation

## User Story

As a new Kaddo user, I want to choose a use case that matches my project, so that I can
understand the correct workflow without reading every command page.

## Expected Behavior

Documentation includes practical use cases for new projects, pre-AI projects, legacy projects
and the full workflow, and clearly explains the current project scope.

## Acceptance Criteria

### AC1 — New Project use case exists
A page explaining how to use Kaddo in a new project: when to use it, command flow, expected
artifacts, CLI vs LLM responsibilities, next steps.

### AC2 — Pre-AI Project use case exists
A page covering scan, context, agents, capabilities, architecture, roadmap, work items, guard.

### AC3 — Legacy Project use case exists
A page emphasizing understand-before-change, risk identification, unknowns, modernization
candidates, small Work Items, ownership and Guard.

### AC4 — Full Workflow page exists
A page showing the complete loop:
`init → scan → context → add agents → understand → create --from roadmap → owners suggest → guard → explain`.

### AC5 — Project Scope page exists
A page explaining what Kaddo does, what it does not do, the CLI layer, the LLM layer, supported
project states and current limitations.

### AC6 — README links to use cases
The main README links to the use cases and project scope pages.

### AC7 — Docs homepage links to use cases
The docs homepage provides a clear entry point for each use case.

### AC8 — EN/ES parity
All use case and scope pages exist in both English and Spanish.

### AC9 — No overpromise
Docs must not claim Kaddo calls LLMs, generates code, fully understands legacy systems
automatically, or replaces human review.

### AC10 — Build passes
`pnpm -r build` succeeds and sidebar/links remain valid.

## Validation

Run `pnpm -r build`. Confirm docs build and links/sidebar entries work.
