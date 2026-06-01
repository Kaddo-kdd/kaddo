# Expected flow — Loyalty Lite (pre-AI project)

| Step | Command | Expected output | Generated artifact | Next step |
|---|---|---|---|---|
| 1 | `kaddo init` | "Kaddo initialized." | `.kaddo/config.yml`, `architecture/*` | Scan the stack |
| 2 | `kaddo scan` | Detected stack + suggested domains | `.kaddo/scan.json`, `architecture/inventory.md` | Generate context |
| 3 | `kaddo context` | "Context pack written." | `.kaddo/context-pack.md` | Install agents |
| 4 | `kaddo add agents` | "Module agents installed." | `architecture/agents/*.md` | Plan |
| 5 | `kaddo understand` | Recommends `capability → architecture → roadmap` | `.kaddo/understand.md` | Run agents |
| 6 | *(LLM)* `capability-agent` | Capabilities list | `architecture/capabilities.md` (sample) | Architecture |
| 7 | *(LLM)* `architecture-agent` | Baseline | `architecture/current-state.md` (sample) | Roadmap |
| 8 | *(LLM)* `roadmap-agent` | Roadmap candidates | `architecture/roadmap.md` (sample) | Create |
| 9 | `kaddo create --from roadmap` | "Created … from roadmap." | `architecture/work-items/WI-001-*.md` | Ownership |
| 10 | `kaddo owners suggest` | Suggests `code:` globs | updated work item | Guard |
| 11 | edit `sample/src/loyalty/points.ts`; `kaddo guard` | ⚠ Possible knowledge drift: WI-001 | terminal FYI | Update WI or ignore |
| 12 | `kaddo explain` | Project summary | `.kaddo/explain.md` | Iterate |

> Steps 6–8 run in your LLM chat; the artifacts here are illustrative samples.
