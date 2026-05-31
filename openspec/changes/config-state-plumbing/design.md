# Design: Config & State Plumbing

## Technical Approach

Add a centralized config module that reads, validates and exposes `.kaddo/config.yml`.
The rest of the codebase is synchronous (`utils/fs.ts`), so the module is synchronous too.

```txt
src/core/config.ts
  loadConfig(dir): KaddoConfig | null      # null if file missing; throws ConfigError if invalid
  requireConfig(dir): KaddoConfig          # exits with a helpful message if missing
  nextStepsForState(state): string         # state-aware guidance (scan)
  createGuidanceForState(state): string    # state-aware helper text (create)
  describeProject(config): string          # e.g. "pre-AI monorepo"
```

## Affected Areas

```txt
src/core/config.ts            # NEW — schema, loader, state-aware helpers
src/commands/scan.ts          # print state-aware next step after baseline write
src/commands/create.ts        # print state-aware helper text after intro
tests/config.test.ts          # NEW — loader + validation + state helpers
```

Existing per-command YAML readers (`guard.ts`, `explain.ts`, `scan.ts` updateConfig) are
left untouched to avoid churn — this VS only adds the centralized module and wires `scan`
and `create`.

## Data Model / Types

```ts
type ProjectState = 'new' | 'pre-ai' | 'legacy'
type TeamSize = 'indie' | 'small' | 'medium' | 'enterprise'
type RepositoryStructure = 'monorepo' | 'multirepo'

type KaddoConfig = {
  version?: string | number
  project: { name: string; state: ProjectState; structure: RepositoryStructure; domains?: string[] }
  team: { size: TeamSize }
  knowledge?: unknown
  guard?: unknown
  scan?: unknown
}
```

Validated with Zod. Missing fields get safe defaults; **invalid enum values produce a
clear validation error** listing valid values. Unknown keys are preserved (`passthrough`).

Suggested defaults (applied only when fields are absent):

```txt
project.state: pre-ai
project.structure: monorepo
team.size: indie
```

## CLI Behavior

`kaddo scan` — after writing the baseline, if config exists, print a state-aware next step:

- **new** → define initial knowledge, first work item, grow roadmap gradually.
- **pre-ai** → use this baseline to create a context pack and understand the system with LLM agents.
- **legacy** → use this baseline to identify risks, unknowns and safe modernization candidates.

`kaddo create` — after the intro, if config exists, print state-aware helper text:

- **new** → "Create the first work item to shape the product."
- **pre-ai** → "Create this work item from existing context or roadmap when available."
- **legacy** → "Prefer small, low-risk work items and capture unknowns."

## Alternatives Considered

- **Each command parses YAML manually** — rejected: duplicates logic, inconsistent behavior.
- **Always require config** — rejected: some commands should show a helpful message before init.
- **Make config complex now** — rejected: v1 stays small.

## Trade-offs

Centralizing config adds upfront structure but prevents inconsistent command behavior as
the CLI grows.

## Risks

- Schema drift from generated config → schema mirrors what `init` writes; tests guard it.
- Commands too coupled to state → state only affects guidance/defaults, not core logic.
- Noisy CLI → minimal, single-line state messages.
