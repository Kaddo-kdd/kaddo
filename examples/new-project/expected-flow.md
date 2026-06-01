# Expected flow — Task Pilot (new project)

| Step | Command | Expected output | Generated artifact | Next step |
|---|---|---|---|---|
| 1 | `kaddo init` | "Kaddo initialized." | `.kaddo/config.yml`, `architecture/knowledge.md`, `architecture/roadmap.md`, `architecture/work-items/` | Generate a context pack |
| 2 | `kaddo context` | "Context pack written." | `.kaddo/context-pack.md` | Install agents |
| 3 | `kaddo add agents` | "Module agents installed." | `architecture/agents/*.md` | Get a state-aware plan |
| 4 | `kaddo understand` | Recommends `roadmap-agent → architecture-agent` for `new` | `.kaddo/understand.md` | Run agents in your LLM |
| 5 | *(LLM)* run `roadmap-agent` | Roadmap with `RM-*` + `WI-CANDIDATE-*` | `architecture/roadmap.md` (see sample) | Create a work item |
| 6 | `kaddo create --from roadmap` | "Created … from roadmap." | `architecture/work-items/WI-001-*.md` | Declare ownership |
| 7 | `kaddo owners suggest` | Suggests `code:` globs | updated work item | Run explain |
| 8 | `kaddo explain` | Project summary + next steps | `.kaddo/explain.md` | Start building |

> Steps 1–4, 6–8 are deterministic CLI output. Step 5 happens in your LLM chat using the
> installed agent prompt; the result here is illustrative.
