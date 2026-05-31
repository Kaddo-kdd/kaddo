---
type: roadmap
updated_at: 2026-05-31
---

# Kaddo — Product Roadmap

> Source of truth: KDD Manifesto v2.5
> Central question: *How does Kaddo know the right knowledge was impacted by this change?*

---

## v1.0 — MVP instalable ✅ DONE

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

## v2.0 — Semantic Plugins

**Goal:** Add stack-specific semantic analysis via optional plugins. Core stays deterministic.

### Semantic diff plugins
- `@kaddo/plugin-prisma` — detects destructive migrations (column removal, type change)
- `@kaddo/plugin-openapi` — detects breaking API changes (removed endpoints, changed contracts)
- `@kaddo/plugin-graphql` — detects schema breaking changes

### `kaddo guard --ci` (strict mode)
Optional blocking CI when a critical domain artifact was not updated and Evidence Score is high.
- Requires explicit `critical: true` in artifact front matter
- Domain owners can configure blocking rules per domain

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

| Step | Deliverable | Why first |
|---|---|---|
| 1 ✅ | Work Items + K-Levels | Allows classifying changes and requesting minimum context |
| 2 ✅ | Ownership front matter | Allows declaring what each artifact protects without a central file |
| 3 ✅ | Guard Lite v1 | Delivers immediate value with glob intersection |
| 4 | Ignore reason | Converts false positives into learning |
| 5 | Transparent Evidence Score | Improves signal without inventing precision |
| 6 | Cheap Classification Drift | Contrasts declared classification with simple signals |
| 7 | Semantic plugins | Adds stack-specific intelligence when the base is installed |

---

## Out of scope (permanently or until explicitly decided)

- Web platform or dashboard
- Mandatory agents or skills as part of Core
- Mandatory LLM integration
- Complex Confidence Score (heuristic percentages)
- Strict CI by default
- Multiagent orchestration
- Blocking guard by default
