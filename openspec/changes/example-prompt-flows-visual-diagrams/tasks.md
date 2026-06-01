# Tasks: Example Prompt Flows & Visual Diagrams

## Implementation Tasks

- [x] Create OpenSpec change.
- [x] Review current examples.
- [x] Decide diagrams live inside `prompt-flow.md` (no standalone `.mmd`).
- [x] Add prompt-flow.md to new-project example.
- [x] Add prompt-flow.md to pre-ai-project example.
- [x] Add prompt-flow.md to legacy-project example.
- [x] Add prompt-flow.md to multirepo-workspace example.
- [x] Add Mermaid diagram to each example.
- [x] Add input/output table to each example.
- [x] Add prompt snippets for each LLM agent used.
- [x] Add artifact chain to each example.
- [x] Add sample output disclaimer.
- [x] Update README links.
- [x] Update docs examples page (EN/ES).
- [x] Update use case pages.
- [x] Update playbook prompt workflow page pointer.
- [x] Ensure no example overpromises LLM automation.

## New Project Example
- [x] Diagram: idea → roadmap → architecture → first Work Item.
- [x] Prompt sequence for roadmap-agent and architecture-agent.
- [x] Expected artifacts.

## Pre-AI Example
- [x] Diagram: existing repo → scan → capabilities → architecture → roadmap → Work Item.
- [x] Prompt sequence for capability-agent, architecture-agent, roadmap-agent.
- [x] Guard demo explanation.

## Legacy Example
- [x] Diagram: legacy system → risks → unknowns → safe roadmap → small Work Item.
- [x] Prompt sequence for legacy-agent, architecture-agent, roadmap-agent.
- [x] Safe-change guidance.

## Multirepo Example
- [x] Diagram: architecture repo → modules → module artifacts.
- [x] Prompt sequence for module-design-agent, stack-agent, security-agent, standards-agent.
- [x] Module artifact chain.

## Validation
- [x] Run `pnpm -r build`.
- [x] Check Mermaid syntax / README + docs links.
- [x] Check CLI vs LLM split is clear and not too verbose.
