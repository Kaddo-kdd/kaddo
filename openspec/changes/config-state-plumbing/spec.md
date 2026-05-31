# Spec: Config & State Plumbing

## User Story

As a Kaddo user, I want the CLI to remember the project type, team size and repository
structure selected during init, so that future commands provide relevant guidance and
outputs.

## Expected Behavior

After `kaddo init`, `.kaddo/config.yml` holds project state, team size, structure and
name. When running `kaddo scan` or `kaddo create`, Kaddo reads that config and adapts its
next-step messaging / helper text to the project state.

## Acceptance Criteria

- [x] AC1 — A single config loading function is used by commands.
- [x] AC2 — Invalid config produces a clear error message.
- [x] AC3 — Missing config is handled with a helpful "run `kaddo init` first" message where required.
- [x] AC4 — `kaddo scan` surfaces project state (in console next-step guidance and/or artifacts).
- [x] AC5 — `kaddo create` adapts guidance based on new / pre-ai / legacy.
- [x] AC6 — Old config files do not crash the CLI when reasonable defaults can be applied.
- [x] AC7 — Tests cover: valid config, missing config, invalid config, invalid state, backward-compatible config, state-aware helpers.

## State-Specific Guidance

- **new** — "Define initial knowledge, create your first work item, and grow the roadmap gradually."
- **pre-ai** — "Use this baseline to create a context pack and understand the existing system with LLM agents."
- **legacy** — "Use this baseline to identify risks, unknowns and safe modernization candidates before changing code."

## Edge Cases

- **Config missing** — helpful message (commands that can run without it still work; baseline write is unaffected).
- **Config incomplete** — apply safe defaults (`pre-ai` / `monorepo` / `indie`).
- **Invalid YAML** — clear parsing error.
- **Unknown project state** — validation error listing valid values (`new`, `pre-ai`, `legacy`).

## Error Handling

- Unreadable / invalid YAML → `ConfigError` with a clear message; command exits non-zero.
- Invalid enum → `ConfigError` listing the field and valid values.

## Output Examples

`kaddo scan` (project `pre-ai`, `monorepo`):

```
This is a pre-AI monorepo.
Next: use this baseline to create a context pack and understand the system with LLM agents.
```

`kaddo create feature` (project `legacy`):

```
Legacy project — prefer small, low-risk work items and capture unknowns.
```

## Validation

```bash
pnpm test
pnpm build
kaddo init
kaddo scan
kaddo create feature
```
