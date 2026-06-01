# Spec: Example Prompt Flows & Visual Diagrams

## User Story

As a Kaddo user, I want each example to show the prompt flow and a visual diagram, so
that I can reproduce the CLI + LLM workflow without guessing.

## Expected Behavior

Each main example includes a `prompt-flow.md` with a Mermaid diagram explaining what
happens at each step and who is responsible (CLI vs LLM).

## Acceptance Criteria

### AC1 — New Project example has prompt flow
Includes CLI commands, LLM prompt sequence, expected outputs, Mermaid diagram and
artifact chain.

### AC2 — Pre-AI example has prompt flow
Covers scan, context, capability-agent, architecture-agent, roadmap-agent,
`create --from roadmap`, ownership, guard and explain.

### AC3 — Legacy example has prompt flow
Covers legacy-agent first, risks/unknowns output, safe roadmap, a small Work Item,
ownership and guard.

### AC4 — Multirepo example has prompt flow
Covers the architecture repo, module mapping, module-design-agent and
stack/security/standards agents, plus module artifacts.

### AC5 — Mermaid diagrams exist
Each main example includes at least one Mermaid diagram.

### AC6 — Input/output tables exist
Each main example includes a table mapping: CLI command / LLM agent / input / output /
save location.

### AC7 — Prompt snippets exist
Each example includes copy/paste prompt handoff snippets.

### AC8 — Artifact chain is clear
Each example shows how artifacts connect from scan/context to explain.

### AC9 — No overpromise
Examples must not imply Kaddo calls LLMs, generates code automatically, or guarantees
correct LLM output. Each prompt-flow carries the sample-output disclaimer.

### AC10 — Docs link to enhanced examples
README and docs (Examples page EN/ES + use-case pages) link to the prompt flows.

## Validation

Run `pnpm -r build`. Confirm the docs build succeeds and any Mermaid blocks in docs
render correctly.
