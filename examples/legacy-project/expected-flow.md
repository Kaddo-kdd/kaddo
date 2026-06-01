# Expected flow — Old Orders (legacy project)

| Step | Command | Expected output | Generated artifact | Next step |
|---|---|---|---|---|
| 1 | `kaddo init` (state: legacy) | "Kaddo initialized." | `.kaddo/config.yml`, `architecture/*` | Scan |
| 2 | `kaddo scan` | Detected stack + open questions | `.kaddo/scan.json`, `architecture/inventory.md` | Context |
| 3 | `kaddo context` | "Context pack written." | `.kaddo/context-pack.md` | Agents |
| 4 | `kaddo add agents` | "Module agents installed." | `architecture/agents/*.md` | Understand |
| 5 | `kaddo understand` | Recommends `legacy → architecture → capability → roadmap` | `.kaddo/understand.md` | Run legacy-agent |
| 6 | *(LLM)* `legacy-agent` | Risks, unknowns, modernization candidates | `architecture/legacy/*.md` (samples) | Architecture |
| 7 | *(LLM)* `architecture-agent` | Baseline | `architecture/current-state.md` | Roadmap |
| 8 | *(LLM)* `roadmap-agent` | Safe, low-risk first steps | `architecture/roadmap.md` | Create |
| 9 | `kaddo create` | "Created …" | `architecture/work-items/WI-001-*.md` | Ownership, Guard |
| 10 | `kaddo explain` | Summary highlighting unknowns | `.kaddo/explain.md` | Iterate carefully |

> The legacy artifacts (step 6) are illustrative samples produced by the agent prompt.
