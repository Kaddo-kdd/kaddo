# Kaddo Examples

Realistic, reproducible examples of Kaddo applied to different project scenarios. Open a
folder, follow its `README.md`, and see how Kaddo turns a project into operative
knowledge.

| Example | Scenario | Project state | Highlights |
|---|---|---|---|
| [new-project](./new-project/) — *Task Pilot* | Greenfield app | `new` | Structured knowledge from day one; full loop |
| [pre-ai-project](./pre-ai-project/) — *Loyalty Lite* | Existing app | `pre-ai` | `scan` + agents + **Guard drift demo** |
| [legacy-project](./legacy-project/) — *Old Orders* | Legacy MVC app | `legacy` | Understand-before-change; legacy artifacts |
| [multirepo-workspace](./multirepo-workspace/) — *Commerce Stack* | Many repos | `multirepo` | `modules map` + per-module artifacts |

## How to read an example

Each folder contains:

- `README.md` — the scenario, the commands to run, and what to inspect.
- `expected-flow.md` — a `command → output → artifact → next step` table.
- committed sample files (`.kaddo/`, `architecture/`, `sample/`) so you can see the
  artifacts without running anything.

## Important — what is real and what is illustrative

- **CLI artifacts** (`.kaddo/config.yml`, `architecture/work-items/*.md`,
  `architecture/roadmap.md` skeleton, `.kaddo/modules.yml`, module folders) are exactly
  what `kaddo` writes.
- **Agent outputs** (capabilities, current-state, filled-in roadmaps) live under
  `sample-agent-outputs/` and are **illustrative** — produced by running the Kaddo agent
  prompts in your own LLM chat. Kaddo never calls an LLM, generates code, or understands a
  system automatically.
