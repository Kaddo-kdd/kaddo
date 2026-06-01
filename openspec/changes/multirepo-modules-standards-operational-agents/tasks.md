# Tasks: Multirepo Modules, Standards & Operational Agents

## Implementation Tasks

- [x] Create OpenSpec change.
- [x] Review existing module command.
- [x] Decide command name: `kaddo modules map` (plural) alongside existing `kaddo module`.
- [x] Define module descriptor schema (`.kaddo/modules.yml`).
- [x] Implement module mapping flow (`runModulesMap`).
- [x] Generate module structure under `architecture/modules/<name>/`.
- [x] Generate `module-design.md`, `stack.md`, `security.md`, `standards.md`.
- [x] Generate module `diagrams/.gitkeep` and `adrs/.gitkeep`.
- [x] No silent overwrite of existing module artifacts.
- [x] Add optional global templates: standards, security, stack, git-strategy (via `kaddo add`).
- [x] Add `work-item-agent.md`.
- [x] Add `git-strategy-agent.md`.
- [x] Add `security-agent.md`.
- [x] Add `standards-agent.md`.
- [x] Add `stack-agent.md`.
- [x] Add `module-design-agent.md`.
- [x] Update agents README with Understanding / Operational categories.
- [x] Add default Git strategy + custom guidance.
- [x] Keep CLI deterministic, no LLM calls.

## Tests

- [x] Test module mapping creates descriptor.
- [x] Test module structure generation.
- [x] Test no silent overwrite.
- [x] Test module path warning path (register anyway).
- [x] Test global templates install.
- [x] Test new agents are installed.
- [x] Test each new agent has required sections.
- [x] Test git-strategy-agent mentions default strategy.
- [x] Test security-agent does not claim security scanning.
- [x] Test docs build.

## Documentation

- [x] Update README with multirepo module mapping + operational agents.
- [x] Update multirepo docs page for the multirepo workflow.
- [x] Document module artifacts.
- [x] Add Git strategy docs page.
- [x] Document security/standards/stack global artifacts.
- [x] Update agents docs with new agents.
- [x] Update playbook prompt-workflow with operational agents.
- [x] Clarify global vs module-level artifacts.
- [x] Maintain EN/ES parity.

## Validation

- [x] Run `pnpm test`.
- [x] Run `pnpm -r build`.
