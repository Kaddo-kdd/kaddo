# Spec: Understand Flow

## User Story

As a Kaddo user, I want a guided command that tells me how to use my context pack with
Kaddo agents in an LLM chat, so that I can turn a scanned project into structured
understanding without guessing the next step.

## Expected Behavior

When the user runs `kaddo understand`, Kaddo generates a guided handoff based on the
project state.

## Acceptance Criteria

- [x] AC1 — If `.kaddo/config.yml` does not exist: "Kaddo is not initialized in this
  project. Run `kaddo init` first." and exit non-zero.
- [x] AC2 — If `.kaddo/scan.json` does not exist: warn "No scan baseline found. Run
  `kaddo scan` first." (continues with a context pack marked incomplete).
- [x] AC3 — Generates or refreshes `.kaddo/context-pack.md`.
- [x] AC4 — If recommended agents are not installed: "Agents are not installed. Run
  `kaddo add agents`."
- [x] AC5 — Recommended agent order depends on state (new / pre-ai / legacy).
- [x] AC6 — Output explains: which context file to paste, which agent prompt to use, what
  to ask the LLM, what output to expect, where to save the result.
- [x] AC7 — Writes a reusable `.kaddo/understand.md`.
- [x] AC8 — No LLM execution / no API keys.
- [x] AC9 — Tests cover: uninitialized project, missing scan, missing agents, new/pre-ai/
  legacy recommendations, and `.kaddo/understand.md` generation.

## Edge Cases

- **Context pack missing** — generate it.
- **Agents partially installed** — identify missing recommended agents and suggest
  `kaddo add agents`.
- **Unknown project state** — config validation falls back to `pre-ai` default (per
  existing config behavior).
- **Empty project knowledge** — the handoff still works and notes missing knowledge.

## Output Example

```
Kaddo Understand

Project: dotear-web
State: pre-ai
Team: indie
Structure: monorepo

Recommended flow:
1. capability-agent → architecture/capabilities.md
2. architecture-agent → architecture/current-state.md
3. roadmap-agent → architecture/roadmap.md

First step: use capability-agent.

Context:       .kaddo/context-pack.md
Agent prompt:  architecture/agents/capability-agent.md
Expected output: architecture/capabilities.md

Instructions:
Open your preferred LLM chat, paste the context pack, then paste the agent prompt. Ask the
LLM to generate the expected output and save it in the target file.

Kaddo does not call an LLM. You stay in control of the interpretation.
```

## Validation

```bash
pnpm test
pnpm build
kaddo understand
```

Confirm: output is clear, `.kaddo/understand.md` is generated, no LLM is called, recommended
agents match project state.
