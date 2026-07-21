# Multirepo Core/Module Initialization and Module Context (VS-091)

## Summary

Adds core/module role distinction to `kaddo init`, introduces `module-context.md` as the
primary knowledge artifact for module repos, and enriches the multirepo toolchain with
module status detection, affected-module tracking in Work Items, branch strategy
suggestions, and scoped capsule exports.

## Key changes

- `kaddo init` now asks for a **role** (`core` or `module`) when `structure: multirepo`.
- **Core** repos get `system-context.md`, `modules.md`, and the full knowledge structure.
- **Module** repos get only `module-context.md` (9 sections), `tech/current-state.md`,
  `tech/codebase.md`, and `delivery/work-items/`. No business, product, agents, or skills.
- New `module-context-agent` and `module-context-refinement` skill.
- `resolveNextStep()` has a module-aware branch that skips business/product/agents/skills
  checks and recommends `refine-module-context` or `init-module-context`.
- `kaddo modules list` shows status detection per module (`configured`, `not_configured`,
  `invalid`).
- Work Item front matter includes `affected_modules: []`.
- Context pack includes module-context for modules referenced by active WIs'
  `affected_modules`.
- Understand handoff includes a branch strategy section when WIs have `affected_modules`.
- `kaddo capsule export --scope system` and `--module <id>` for scoped exports.

## Constraints

- CLI remains deterministic — no LLM, no git mutation.
- MCP remains read-only except derived paths under `.kaddo/` and WI lifecycle transitions.
- EN/ES doc parity maintained.
