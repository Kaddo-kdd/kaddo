---
type: roadmap
updated_at: 2026-05-31
---

# Kaddo — Product Roadmap

> Source of truth: KDD Manifesto v2.5
> Central question: *How does Kaddo know the right knowledge was impacted by this change?*

---

## Released versions

| Tag | Date | Description |
|---|---|---|
| [v1.0.0](https://github.com/judlup/kaddo/releases/tag/v1.0.0) | 2026-05-31 | MVP: init · scan · create · guard (Guard Lite) |
| [v1.0.1](https://github.com/judlup/kaddo/releases/tag/v1.0.1) | 2026-05-31 | Ignore reason: guard FYIs ignorable with reason, `kaddo ignore` command |
| [v1.1.0](https://github.com/judlup/kaddo/releases/tag/v1.1.0) | 2026-05-31 | `kaddo explain`: Knowledge Repository → context for humans and agents |
| [v1.1.1](https://github.com/judlup/kaddo/releases/tag/v1.1.1) | 2026-05-31 | Evidence Score transparente en guard FYIs (señales observadas, sin porcentajes mágicos) |
| [v1.2.0](https://github.com/judlup/kaddo/releases/tag/v1.2.0) | 2026-05-31 | `kaddo classify`: Classification Drift barato con señales observadas del diff |
| [v1.3.0](https://github.com/judlup/kaddo/releases/tag/v1.3.0) | 2026-05-31 | `kaddo status` · `kaddo learn` · `kaddo history` — observabilidad del Knowledge Repository |
| [v1.4.0](https://github.com/judlup/kaddo/releases/tag/v1.4.0) | 2026-05-31 | `kaddo guard --ci` — output JSON para CI/PR, no bloqueante |
| [v2.0.0](https://github.com/judlup/kaddo/releases/tag/v2.0.0) | 2026-05-31 | Optional module system: `kaddo add [adr\|incident\|rfc\|migration\|legacy]` |
| [v2.1.0](https://github.com/judlup/kaddo/releases/tag/v2.1.0) | 2026-05-31 | Semantic plugins: `prisma` (destructive migrations) + `openapi` (breaking contracts) |
| [v2.2.0](https://github.com/judlup/kaddo/releases/tag/v2.2.0) | 2026-05-31 | Domain Owners: `kaddo owners`, guard notifies owners by domain |
| [v2.3.0](https://github.com/judlup/kaddo/releases/tag/v2.3.0) | 2026-05-31 | Multirepo Module Descriptor: `kaddo module --init` · `kaddo module --show` |
| [v2.4.0](https://github.com/judlup/kaddo/releases/tag/v2.4.0) | 2026-05-31 | Módulos adicionales: `kaddo add contracts` · `kaddo add capabilities` · `kaddo add guard-advanced` |
| [v2.5.0](https://github.com/judlup/kaddo/releases/tag/v2.5.0) | 2026-05-31 | Módulos agents + skills · `explain --type` · agent output enriquecido |
| v2.6.0 _(unreleased)_ | 2026-05-31 | Knowledge Loop: `understand` · roadmap-agent output · `create --from roadmap` · Guard Lite end-to-end · `owners suggest` · project `explain` · docs realignment + use-case guides + prompt playbook |

---

## v2.6 — Knowledge Loop ✅ DONE (unreleased)

**Goal:** Close the first full Kaddo loop end-to-end and reduce the friction of declaring
ownership, so knowledge flows from understanding to code and back:

```txt
scan → context → understand → agents → roadmap → work item → ownership → guard → drift
```

| Slice | Feature | Status | Description |
|---|---|---|---|
| VS-006 | `kaddo understand` | ✅ Done | Refreshes `.kaddo/context-pack.md` + writes `.kaddo/understand.md` handoff — CLI prepares context, the LLM creates the understanding |
| VS-009 | Roadmap Agent output | ✅ Done | Standardized `roadmap-agent` prompt → structured `architecture/roadmap.md` (initiatives `RM-*`, candidate work items `WI-CANDIDATE-*`, knowledge levels, impact/risk, dependencies). No LLM in the CLI |
| VS-010 | `kaddo create --from roadmap` | ✅ Done | Parses roadmap candidates, prefills a real Work Item (title, type, level, expected value, notes, initiative) with `source`/`source_id`/`source_initiative` traceability; asks only missing fields |
| VS-012 | Guard Lite end-to-end | ✅ Done | Validated drift detection against real artifacts; clearer actionable FYI (drift heading, changed files, declared ownership, suggested action); suppressed when artifact also changed; cross-platform paths; non-blocking |
| VS-011 | `kaddo owners suggest` | ✅ Done | Ownership Front Matter Assistant: finds Work Items missing `code:`, suggests globs from `.kaddo/scan.json` + `domains`/`capabilities`, manual entry fallback, preserves keys + body. Deterministic, no LLM |
| VS-013 | Project `explain` | ✅ Done | Default `kaddo explain` summarizes project state from config/scan/knowledge/work-items/ownership, lists missing knowledge + next steps, `--for human`/`--for agent`, writes `.kaddo/explain.md` + `.kaddo/explain.json`. Pure module `core/project-explain.ts`, no LLM, no source-code loading. Focused `--scope/--type/--since` preserved |
| VS-014 | Documentation realignment | ✅ Done | README, CLI README, docs homepage, getting-started and command overview realigned around the real loop; new Workflow page; CLI-vs-LLM split + project states made explicit; EN/ES aligned; no overpromise. Docs only |
| VS-015 | Use-case guides + project scope | ✅ Done | New use-case pages (new / pre-AI / legacy / full workflow) + Project Scope page, EN/ES; homepage + README entry points; sidebar "Use Cases" group. Docs only |
| VS-016 | Prompt Playbook + Work Item traceability | ✅ Done | New Playbook section (Concepts, Prompt Workflow, Work Item Traceability, Examples with Other Tools, Collaboration Guide), EN/ES; sidebar "Playbook" group + README links; defines Kaddo vocabulary, CLI-input→prompt→output→artifact table, traceability chain, tool usage patterns (not official integrations), governance-by-exception collaboration. Docs only, no overpromise |

**Principles preserved:** deterministic CLI, no LLM in core, Guard non-blocking, no ownership
inference, no Confidence Score, the human always confirms.

**Tests:** 274 total · CLI build + docs build green.

---

## v1.0 — MVP instalable ✅ DONE
> Tag: [v1.0.0](https://github.com/judlup/kaddo/releases/tag/v1.0.0)

**Goal:** Minimum installable version. A person can run the four core commands and feel the flow doesn't get in the way.

| Command | Status | Description |
|---|---|---|
| `kaddo init` | ✅ Done | Creates `.kaddo/config.yml`, `architecture/`, `work-items/` |
| `kaddo scan` | ✅ Done | Deterministic stack detection (language, framework, package manager, migrations, contracts, infra) |
| `kaddo create [type]` | ✅ Done | Work Items with minimum questions per Knowledge Level (K1–K3) |
| `kaddo guard` | ✅ Done | Guard Lite: git diff vs declared code globs → non-blocking FYI |

**Knowledge Levels implemented:** K0, K1, K2, K3, K4 definitions  
**Work item types:** `feature`, `bugfix`, `hotfix`, `spike`  
**Guard Lite rules:** no Confidence Score, no semantic diff, non-blocking, silent without ownership

## Build order step 4 — Ignore reason ✅ DONE
> Tag: [v1.0.1](https://github.com/judlup/kaddo/releases/tag/v1.0.1)

**Goal:** Convert false positives into learning. Guard FYIs can be ignored with an explicit reason.

| Feature | Status | Description |
|---|---|---|
| Interactive ignore after FYI | ✅ Done | Guard offers to ignore each FYI immediately after showing it |
| `kaddo ignore add <id> <reason>` | ✅ Done | Non-interactive: add an ignore from CLI or scripts |
| `kaddo ignore list` | ✅ Done | Show all active ignores with reason and date |
| `kaddo ignore remove <id>` | ✅ Done | Remove an ignore entry |
| `.kaddo/ignores.yml` | ✅ Done | Persisted ignore store, YAML, one entry per artifact |
| `guard --no-interactive` | ✅ Done | Disable prompts for CI use |

---

## Build order step 6 — kaddo classify ✅ DONE
> Tag: [v1.2.0](https://github.com/judlup/kaddo/releases/tag/v1.2.0)

**Goal:** Contrast declared classification against cheap observed signals in git diff. No LLM. No semantic analysis.

| Feature | Status | Description |
|---|---|---|
| `kaddo classify` | ✅ Done | Reads active work item + git diff, detects signal drift |
| `kaddo classify --type <t>` | ✅ Done | Override without active work item |
| `kaddo classify --staged` | ✅ Done | Staged-only diff mode |
| DB migration signals | ✅ Done | supabase/migrations, prisma/migrations, db/migrations |
| API/event contract signals | ✅ Done | openapi.*, swagger.*, events/, schemas/, contracts/ |
| Infrastructure signals | ✅ Done | terraform/, docker-compose.yml, k8s/, .github/workflows/ |
| Dependency signals | ✅ Done | package.json, lockfiles, requirements.txt, pyproject.toml |

Output example when drift detected:
```
Declared:  bugfix / K2

Observed signals:
  - DB migration: supabase/migrations/add_payments_table.sql
    → Data schema change — typically K4 or Migration type

Suggested review:
  This may be more than a bugfix. Signals suggest migration (K4). Review before closing.
  Consider: migration / architecture-change
```

---

## Build order step 5 — kaddo explain ✅ DONE
> Tag: [v1.1.0](https://github.com/judlup/kaddo/releases/tag/v1.1.0)

**Goal:** Convert the Knowledge Repository into readable context for humans and agents. Token-efficient: front matters and summaries only, full docs on demand.

| Feature | Status | Description |
|---|---|---|
| `kaddo explain` | ✅ Done | Human-readable summary: knowledge.md + active work items + roadmap now |
| `kaddo explain --for agent` | ✅ Done | Structured JSON: front matters + summaries + domains, no full docs |
| `kaddo explain --scope <domain>` | ✅ Done | Filters artifacts by domain, code glob, or keyword |
| `kaddo explain --since <date>` | ✅ Done | Limits output to artifacts created since a given date |

---

## v1.3 — Knowledge Visibility ✅ DONE
> Tag: [v1.3.0](https://github.com/judlup/kaddo/releases/tag/v1.3.0)

| Command | Status | Description |
|---|---|---|
| `kaddo status` | ✅ Done | Project name, stack, work item counts by status, ownership coverage, active items |
| `kaddo learn [id]` | ✅ Done | Closes a work item, records learning, marks `status: done` |
| `kaddo history` | ✅ Done | Lists all work items sorted by date with filters: `--domain`, `--type`, `--status`, `--limit` |

---

## v1.1 — Knowledge Visibility

**Goal:** Make the Knowledge Repository observable and useful for daily work without opening files.

### `kaddo status`
Shows the current state of the Knowledge Repository.
- Count of work items by status (in-progress, done, cancelled)
- Count of artifacts with ownership declared (`code:` not empty)
- Domains detected and active
- Last scan result summary

### `kaddo learn`
Closes a work item and registers what was actually learned.
- Marks work item `status: done`
- Prompts for learning summary (1–3 sentences)
- Updates `## Learning` section in the work item file
- Suggests updating `architecture/knowledge.md` if the change affects current state

### `kaddo explain`
Converts the Knowledge Repository into readable context — for humans or agents.
- `kaddo explain` → summary of the project for a new team member
- `kaddo explain --for agent` → structured minimum context (front matters + summaries, no full docs)
- `kaddo explain --scope payments` → only artifacts and knowledge related to a domain
- `kaddo explain --since last-release` → what changed since a given ref

**Token efficiency rule:** full documents are loaded only when metadata and summaries are insufficient.

---

## v1.2 — Classification Intelligence

**Goal:** Contrast declared classification against observed signals in the diff. No LLM. No semantic analysis.

### `kaddo classify`
Reads `git diff` and compares observed signals against the declared work item type.

**Cheap signals detected in v1.2:**

| Signal | Detection | Implication |
|---|---|---|
| DB migration | New/changed file in `supabase/migrations/`, `prisma/migrations/`, `db/migrations/` | K4 or Migration |
| API contract | Change in `openapi.*`, `routes/`, `schemas/` | K3/K4 |
| Event contract | Change in `events/**` | K3/K4 |
| Dependencies | Change in `package.json`, `lockfile`, `requirements.txt` | K2–K4 |
| Infrastructure | Change in `terraform/`, `serverless.yml`, `docker-compose.yml` | K3/K4 |

Output example:
```
Declared: bugfix

Observed signals:
  - supabase/migrations/add_payment_table.sql added
  - package.json changed

Suggested review:
  This may be more than a bugfix. Consider: Migration or Feature (K3/K4).
```

Kaddo does not replace human decision. It contrasts and shows disagreement when there's sufficient evidence.

### `kaddo history`
Queries work item history by domain, type, or artifact.
- `kaddo history` → all work items sorted by date
- `kaddo history --domain payments` → work items touching the payments domain
- `kaddo history --type migration` → all migrations
- `kaddo history --status done` → completed work items

Does not load full documents. Reads front matter only.

---

## v1.4 — CI Integration ✅ DONE
> Tag: [v1.4.0](https://github.com/judlup/kaddo/releases/tag/v1.4.0)

| Feature | Status | Description |
|---|---|---|
| `kaddo guard --ci` | ✅ Done | JSON output, no prompts, non-blocking exit code |
| `kaddo guard --json` | ✅ Done | Alias for --ci, same output |
| JSON findings shape | ✅ Done | `artifact_id`, `knowledge_level`, `matched_files`, `evidence`, `message` |
| `ignored_count` in output | ✅ Done | CI can see how many FYIs were suppressed by ignores |

---

## v1.3 — CI Integration

**Goal:** Make Guard Lite available in pull request workflows without blocking by default.

### `kaddo guard --ci`
Non-blocking CI mode. Posts FYI as a PR comment, does not fail the pipeline.
- Outputs machine-readable JSON (`--json`) for CI consumption
- Annotates PR with matched artifacts
- Respects `silent_without_ownership: true` config

### Evidence Score (transparent)
Replaces any future percentage with an explicit signal count.

```
Evidence: 3/3 globs matched · artifact K4 · domain: payments
```

Formula: `signals_observed / signals_configured`  
Rule: the number only appears with its explanation. If it cannot be explained, it is not shown.

---

## v2.0 — Optional Module System ✅ DONE
> Tag: [v2.0.0](https://github.com/judlup/kaddo/releases/tag/v2.0.0)

**Goal:** Extend Kaddo with optional work item types via installable modules. Teams only install what they need.

**Shipped:**
- `kaddo add [module]` — install a module (adr, incident, rfc, migration, legacy)
- `kaddo add` without args — lists available modules
- Module work item types auto-detected in `kaddo create <type>`
- Module installation state tracked in `.kaddo/config.yml`
- 5 built-in modules: ADR (K4), Incident (K3), RFC (K3), Migration (K4), Legacy (K3)

---

## v2.1 — Semantic Plugins ✅ DONE
> Tag: [v2.1.0](https://github.com/judlup/kaddo/releases/tag/v2.1.0)

**Goal:** Add stack-specific semantic analysis via optional plugins. Core stays deterministic.

**Shipped:**
- `KaddoPlugin` interface — `detect(files, readFile): PluginSignal[]`
- `plugin-prisma` — detects DROP COLUMN, DROP TABLE, RENAME COLUMN, ALTER TYPE, TRUNCATE in migration files
- `plugin-openapi` — detects modified OpenAPI/Swagger contract files, flags breaking diff patterns
- Plugin registry: `resolvePlugins(names)`, `runPlugins(plugins, files, readFile)` — non-fatal on plugin failure
- Guard integration: plugins run on every `kaddo guard` call, signals shown after FYIs
- CI JSON output includes `plugin_signals` array
- Enable via `.kaddo/config.yml`: `plugins: [prisma, openapi]`
- 17 new tests, 137 total

### Semantic diff plugins
- `@kaddo/plugin-prisma` — detects destructive migrations (column removal, type change)
- `@kaddo/plugin-openapi` — detects breaking API changes (removed endpoints, changed contracts)
- `@kaddo/plugin-graphql` — detects schema breaking changes

### `kaddo guard --ci` (strict mode)
Optional blocking CI when a critical domain artifact was not updated and Evidence Score is high.
- Requires explicit `critical: true` in artifact front matter
- Domain owners can configure blocking rules per domain

---

## v2.2 — Domain Owners ✅ DONE
> Tag: [v2.2.0](https://github.com/judlup/kaddo/releases/tag/v2.2.0)

**Goal:** Surface who should review a change based on which domains' artifacts matched in guard.

**Shipped:**
- `kaddo owners` — lists all domain owners configured in `.kaddo/config.yml`
- `kaddo owners --domain <name>` — shows owners for a specific domain
- Guard integration: after FYIs, prints "Domain owners to notify: alice, bob (payments)"
- CI JSON includes `domain_owners` array with `{ domain, owners }` entries
- Config format: `owners: { payments: [alice, bob], orders: [carol] }`
- 13 new tests, 150 total

---

## v2.3 — Multirepo Module Descriptor ✅ DONE
> Tag: [v2.3.0](https://github.com/judlup/kaddo/releases/tag/v2.3.0)

**Goal:** Each repository declares its identity so dependent repos and agents can understand boundaries, contracts, and ownership.

**Shipped:**
- `kaddo module --init` — interactive wizard creates `architecture/module.yml`
- `kaddo module --show` — prints the current descriptor in human-readable form
- `kaddo module` (no flags) — auto-detects: shows if descriptor exists, prompts init if not
- Descriptor fields: `name`, `purpose`, `stack`, `responsibilities`, `contracts`, `dependencies`, `boundaries`, `ownership`, `related_artifacts`
- 4 new tests, 154 total

---

## v2.5 — Agents, Skills y explain mejorado ✅ DONE
> Tag: [v2.5.0](https://github.com/judlup/kaddo/releases/tag/v2.5.0)

**Goal:** Completar el catálogo del manifiesto con agents y skills, y enriquecer `explain` para contextos de agentes.

**Shipped:**
- `kaddo add agents` — define agentes AI que operan sobre el Knowledge Repository (K3, 3 preguntas: purpose, knowledge_inputs, outputs)
- `kaddo add skills` — define capacidades reutilizables entre agentes y equipos (K3, 3 preguntas: what_it_does, trigger, inputs_outputs)
- `kaddo explain --type <type>` — filtra artefactos por tipo exacto (adr, rfc, feature, contract, etc.)
- `explain --scope` ahora también coincide en el campo `type` del artefacto
- Agent output (`--for agent`) ahora incluye: `domain_owners`, `installed_modules`, `enabled_plugins`, `scope`, `type_filter`
- Human output muestra "Related artifacts" cuando se filtra por scope o type
- Módulos totales: 10 — catálogo completo del manifiesto KDD v2.5
- 168 tests totales

---

## v2.4 — Módulos adicionales del manifiesto ✅ DONE
> Tag: [v2.4.0](https://github.com/judlup/kaddo/releases/tag/v2.4.0)

**Goal:** Completar el catálogo de módulos opcionales definidos en el manifiesto KDD v2.5.

**Shipped:**
- `kaddo add contracts` — documenta contratos API, eventos e integraciones compartidas (K4, 4 preguntas)
- `kaddo add capabilities` — mapea capacidades de producto a dominios e ingeniería (K3, 3 preguntas)
- `kaddo add guard-advanced` — instala `architecture/guard-rules/rules.yml` con configuración de reglas CI, bloqueo en artefactos críticos y umbrales por dominio
- Módulos totales: 8 (`adr`, `incident`, `rfc`, `migration`, `legacy`, `contracts`, `capabilities`, `guard-advanced`)
- 160 tests totales

---

## v2.x — Enterprise and Multirepo

**Goal:** Support larger teams, domain ownership, and multirepo architectures.

### Domain Ownership
- Domain Owners per domain (declared in `.kaddo/config.yml`)
- Each owner reviews only changes in their domain
- `kaddo guard` notifies relevant owners

### Multirepo Module Descriptor
Each repository declares its identity in `architecture/module.md` or `.kaddo/module.yml`:
- `name`, `purpose`, `responsibilities`, `stack`
- `contracts`, `dependencies`, `boundaries`
- `ownership`, `related-artifacts`

### Governance levels
| Level | Model | Explicit review |
|---|---|---|
| 1 — Indie | Developer → Knowledge | No owner |
| 2 — Small team | Developer → PR → Knowledge | Natural in PR |
| 3 — Medium team | Developer → Knowledge → Tech Lead by exception | ADR, RFC, Architecture Change |
| 4 — Enterprise | Domain Owners per domain | Each owner reviews their domain only |

---

## Modules roadmap (`kaddo add`)

Modules are optional. Core includes only what is needed to start.

| Module | Command | Purpose | When to add |
|---|---|---|---|
| ADR | `kaddo add adr` | Record architectural decisions when risk justifies it | When architectural decisions become recurring |
| RFC | `kaddo add rfc` | Explore relevant changes before building them | When proposals need review before work starts |
| Incident | `kaddo add incident` | Document incidents, learnings, and preventive actions | When there is production and postmortems to learn from |
| Migration | `kaddo add migration` | Manage data, infra, or technology changes with more rigor | When schema or infra migrations are frequent |
| Legacy | `kaddo add legacy` | Understand systems with technical debt before modifying them | When touching systems with low knowledge and high debt |
| Contracts | `kaddo add contracts` | Add API, event, or integration contracts | When multiple services share contracts |
| Capabilities | `kaddo add capabilities` | Map product capabilities and relate them to domains and decisions | When product/engineering alignment is needed |
| Guard Advanced | `kaddo add guard-advanced` | Evidence Score, Classification Drift, CI rules, deeper analysis | After Guard Lite has proven value |
| Agents | `kaddo add agents` | Add reusable agents when the team already has sufficient structure | When the Knowledge Repository is stable enough |
| Skills | `kaddo add skills` | Add reusable capabilities across agents, teams, or projects | When agents are in use |

---

## CLI full roadmap (from manifesto §26)

| Version | Commands | Purpose |
|---|---|---|
| v1.0 | `init`, `scan`, `create`, `guard` | Install Core, detect structure, create Work Items, alert on ownership/globs |
| v1.1 | `status`, `explain`, `learn` | Show knowledge state, explain project, register learning |
| v1.2 | `classify`, `history` | Contrast declared classification with cheap signals, query history by domain/artifact |
| v1.3 | `guard --ci`, Evidence Score | PR/CI integration, transparent signal-based score |
| v2.0 | Semantic plugins, `guard --ci` strict | Stack-specific semantic diff via plugins |
| v2.x | Domain Owners, `explain --scope`, multirepo | Enterprise rules, per-domain guard, multirepo module descriptors |

---

## Build order (from manifesto §21)

| Step | Deliverable | Why first | Status |
|---|---|---|---|
| 1 | Work Items + K-Levels | Allows classifying changes and requesting minimum context | ✅ v1.0.0 |
| 2 | Ownership front matter | Allows declaring what each artifact protects without a central file | ✅ v1.0.0 |
| 3 | Guard Lite v1 | Delivers immediate value with glob intersection | ✅ v1.0.0 |
| 4 | Ignore reason | Converts false positives into learning | ✅ v1.0.1 |
| 5 | `kaddo explain` | Converts the Knowledge Repository into context for humans and agents | ✅ v1.1.0 |
| 5b | Transparent Evidence Score | Improves signal without inventing precision | ✅ v1.1.1 |
| 6 | Cheap Classification Drift (`kaddo classify`) | Contrasts declared classification with simple signals | ✅ v1.2.0 |
| 7 | Semantic plugins | Adds stack-specific intelligence when the base is installed | ✅ v2.1.0 |
| 8 | `kaddo understand` | Hands off a deterministic context pack to the LLM | ✅ v2.6 (unreleased) |
| 9 | Roadmap Agent output + `create --from roadmap` | Turns roadmap candidates into traceable Work Items | ✅ v2.6 (unreleased) |
| 10 | Guard Lite end-to-end | Validates drift detection with clear, actionable, non-blocking FYIs | ✅ v2.6 (unreleased) |
| 11 | `kaddo owners suggest` | Removes the friction of declaring `code:` ownership | ✅ v2.6 (unreleased) |

---

## Out of scope (permanently or until explicitly decided)

- Web platform or dashboard
- Mandatory agents or skills as part of Core
- Mandatory LLM integration
- Complex Confidence Score (heuristic percentages)
- Strict CI by default
- Multiagent orchestration
- Blocking guard by default
