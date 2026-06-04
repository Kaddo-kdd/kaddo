# Expected flow — Old Orders (legacy project)

| Step | Command | Expected output | Generated artifact | Next step |
|---|---|---|---|---|
| 1 | `kaddo init` (state: legacy) | "Kaddo initialized." | `.kaddo/config.yml`, `knowledge/*` | Scan |
| 2 | `kaddo scan` | Detected stack + open questions | `.kaddo/scan.json`, `knowledge/inventory.md` | Context |
| 3 | `kaddo context` | "Context pack written." | `.kaddo/context-pack.md` | Agents |
| 4 | `kaddo add agents` | "Module agents installed." | `knowledge/agents/*.md` | Understand |
| 5 | `kaddo understand` | Recommends `legacy → architecture → capability → roadmap` | `.kaddo/understand.md` | Run legacy-agent |
| 6 | *(LLM)* `legacy-agent` | Risks, unknowns, modernization candidates | `knowledge/legacy/*.md` (samples) | Architecture |
| 7 | *(LLM)* `architecture-agent` | Baseline | `knowledge/tech/current-state.md` | Roadmap |
| 8 | *(LLM)* `roadmap-agent` | Safe, low-risk first steps | `knowledge/delivery/roadmap.md` | Create |
| 9 | `kaddo create` | "Created …" | `knowledge/delivery/work-items/WI-001-*.md` | Ownership, Guard |
| 10 | `kaddo explain` | Summary highlighting unknowns | `.kaddo/explain.md` | Iterate carefully |

> The legacy artifacts (step 6) are illustrative samples produced by the agent prompt.
