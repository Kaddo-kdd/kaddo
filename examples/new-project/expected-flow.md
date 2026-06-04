# Expected flow — Task Pilot (new project)

| Step | Command | Expected output | Generated artifact | Next step |
|---|---|---|---|---|
| 1 | `kaddo init` | "Kaddo initialized." | `.kaddo/config.yml`, `knowledge/knowledge.md`, `knowledge/delivery/roadmap.md`, `knowledge/delivery/work-items/` | Bootstrap the knowledge base |
| 2 | `kaddo bootstrap` | "Minimal knowledge base ready." | `knowledge/business/business.md`, `knowledge/product/product.md`, `knowledge/tech/codebase.md` | Generate a context pack |
| 3 | `kaddo context` | "Context pack written." | `.kaddo/context-pack.md` | Install agents |
| 4 | `kaddo add agents` | Installs the recommended set for `new` | `knowledge/agents/<layer>/*.md` (business/product/tech/delivery) | Get a state-aware plan |
| 5 | `kaddo understand` | Recommends agents incl. `capability-agent → architecture-agent` for `new` | `.kaddo/understand.md` | Run agents in your LLM |
| 6 | *(LLM)* run `architecture-agent` | The **reality** baseline | `knowledge/tech/current-state.md` (distinct from `codebase.md` intent) | Shape the roadmap |
| 7 | *(LLM)* run `roadmap-agent` | Roadmap with `RM-*` + `WI-CANDIDATE-*` | `knowledge/delivery/roadmap.md` (see sample) | Create a work item |
| 8 | `kaddo create --from roadmap` | "Created … from roadmap." | `knowledge/delivery/work-items/WI-001-*.md` | Declare ownership |
| 9 | `kaddo owners suggest` | Suggests `code:` globs (human confirms) | updated work item | Run explain |
| 10 | `kaddo explain` | Project summary by layer + next steps | `.kaddo/explain.md` | Start building |

> The CLI steps are deterministic output. Steps 6–7 happen in your LLM chat using the
> installed agent prompts; the results here are illustrative. `codebase.md` is the
> **intent** (how we plan to build it); `current-state.md` is the **reality** (how it is
> actually built) — they are kept distinct.
