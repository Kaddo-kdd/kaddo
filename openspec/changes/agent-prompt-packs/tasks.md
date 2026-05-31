# Tasks: Agent Prompt Packs

## Implementation Tasks

- [x] Review existing `add` / module installation system.
- [x] Review current `src/modules/agents.ts`.
- [x] Decide final installed directory: `architecture/agents/`.
- [x] Create source prompt pack files (`src/agents/prompts.ts`).
- [x] Implement `capability-agent.md`.
- [x] Implement `architecture-agent.md`.
- [x] Implement `roadmap-agent.md`.
- [x] Implement `legacy-agent.md`.
- [x] Implement `adr-agent.md`.
- [x] Update agents module to install prompt files.
- [x] Require `.kaddo/config.yml` before installing.
- [x] Ensure safe overwrite behavior (partial install).
- [x] Print useful next-step instructions.
- [x] Do not install agents during `kaddo init`.

## Tests

- [x] `kaddo add agents` creates `architecture/agents/`.
- [x] All base agent files are created.
- [x] Each agent contains required sections.
- [x] Existing agent files are not overwritten silently.
- [x] Partial installation installs missing agents only.
- [x] Uninitialized project shows helpful error.
- [x] `kaddo init` does not install agents.

## Documentation

- [x] Update README with `kaddo add agents`.
- [x] Add docs page for Agent Prompt Packs.
- [x] Explain agents are used in the user's LLM chat.
- [x] Explain Kaddo does not execute agents.
- [x] Explain recommended agent order by project state.
- [x] Add example workflow using `.kaddo/context-pack.md`.

## Validation

- [x] Run tests.
- [x] Run build.
- [ ] Manually run `kaddo add agents` in a sample initialized project.
- [ ] Open generated agents and confirm they are usable.
