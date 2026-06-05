---
type: roadmap
updated_at: 2026-06-01
---

# Kaddo — Product Roadmap

> Source of truth: KDD Manifesto v2.5
> Central question: *How does Kaddo know the right knowledge was impacted by this change?*

**Principles (never broken):** deterministic CLI · no LLM in core · Guard non-blocking ·
no ownership inference · no Confidence Score · the human always confirms.

---

## Released versions

| Tag | Description |
|---|---|
| [v1.0.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v1.0.0) | MVP: `init` · `scan` · `create` · `guard` (Guard Lite) |
| [v1.0.1](https://github.com/Kaddo-kdd/kaddo/releases/tag/v1.0.1) | Ignore reason: ignore guard FYIs with a reason (`kaddo ignore`) |
| [v1.1.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v1.1.0) | `kaddo explain`: Knowledge Repository → context for humans and agents |
| [v1.1.1](https://github.com/Kaddo-kdd/kaddo/releases/tag/v1.1.1) | Transparent Evidence Score in guard FYIs (observed signals, no magic %) |
| [v1.2.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v1.2.0) | `kaddo classify`: cheap Classification Drift from diff signals |
| [v1.3.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v1.3.0) | `kaddo status` · `learn` · `history` — Knowledge Repository observability |
| [v1.4.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v1.4.0) | `kaddo guard --ci` — non-blocking JSON output for CI/PR |
| [v2.0.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v2.0.0) | Optional module system: `kaddo add [adr\|incident\|rfc\|migration\|legacy]` |
| [v2.1.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v2.1.0) | Semantic plugins: `prisma` (destructive migrations) + `openapi` (breaking contracts) |
| [v2.2.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v2.2.0) | Domain Owners: `kaddo owners`, guard notifies owners by domain |
| [v2.3.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v2.3.0) | Multirepo Module Descriptor: `kaddo module --init` · `--show` |
| [v2.4.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v2.4.0) | Modules: `contracts` · `capabilities` · `guard-advanced` |
| [v2.5.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v2.5.0) | Modules `agents` + `skills` · `explain --type` · richer agent output |
| [v2.6.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v2.6.0) | Knowledge Loop end-to-end + templates, multirepo modules, demo examples, docs polish (see below) |
| [v2.7.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v2.7.0) | Multirepo hardening: module artifacts from the template registry, module-aware `context`/`explain`, opt-in `guard --workspace` (VS-025→VS-027) |
| [v2.8.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v2.8.0) | Project Knowledge Bootstrap: `kaddo bootstrap` for new projects (Business → Architecture → Codebase → Development), business templates + bootstrap agents (VS-028) |
| [v3.0.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v3.0.0) | Knowledge Repository Realignment: `architecture/` → `knowledge/`, layers Business → Product → Tech → Delivery, context/explain by layer (VS-029, breaking) |
| [v3.1.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v3.1.0) | Minimum Sufficient Knowledge: bootstrap one consolidated file per layer; progressive `add agents` by group (VS-030) |
| [v3.2.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v3.2.0) | New Project Flow Hardening: per-layer agent folders; capability+architecture in `new`; explain Work Item parser fix; intent vs reality (VS-031) |
| [v3.3.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v3.3.0) | Work Item Delivery Workflow: `understand` delivery lifecycle (branch → scan → ownership → guard → knowledge → commit) for active Work Items (VS-035) |
| [v3.4.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v3.4.0) | Delivery protocol in the work-item-agent: branch first per the Git strategy; commit only with human confirmation; CLI never touches git (VS-036) |
| [v3.5.0](https://github.com/Kaddo-kdd/kaddo/releases/tag/v3.5.0) | Knowledge Discovery & Semantic Recognition (front-matter type, per-layer maturity); context pack Operating Rules (agents never commit without confirmation) (VS-037) |

---

## v2.6 — Knowledge Loop ✅ Released

Close the first full Kaddo loop and reduce the friction of declaring ownership:

```txt
scan → context → understand → agents → roadmap → work item → ownership → guard → drift
```

| Slice | Feature | Summary |
|---|---|---|
| VS-006 | `kaddo understand` | Refreshes `.kaddo/context-pack.md` + writes `.kaddo/understand.md` handoff |
| VS-009 | Roadmap Agent output | Standard `roadmap-agent` prompt → structured `architecture/roadmap.md` (`RM-*`, `WI-CANDIDATE-*`) |
| VS-010 | `create --from roadmap` | Parses roadmap candidates → prefilled, traceable Work Item (`source`/`source_id`) |
| VS-011 | `owners suggest` | Suggests `code:` globs from scan + domains/capabilities; deterministic |
| VS-012 | Guard Lite end-to-end | Validated drift detection; clearer actionable FYIs; suppressed when artifact also changed |
| VS-013 | Project `explain` | Summarizes project state + missing knowledge + next steps; `--for human/agent` |
| VS-014 | Docs realignment | README + docs realigned around the real loop; Workflow page; EN/ES |
| VS-015 | Use-case guides | New / pre-AI / legacy / full-workflow pages + Project Scope; EN/ES |
| VS-016 | Prompt Playbook | Concepts, Prompt Workflow, Work Item Traceability, tool patterns, collaboration; EN/ES |
| VS-017 | Multirepo & operational agents | `kaddo modules map/list`; global standards/security/stack/git-strategy; 6 operational agents |
| VS-018 | Templates registry | Typed registry of 23 templates (core/architecture/module/operations/legacy) + Templates docs |
| VS-019 | Demo examples | 4 example repos (new/pre-ai/legacy/multirepo) + "Writing a custom agent" guide; docs only |
| VS-020 | Example prompt flows | `prompt-flow.md` per example: Mermaid diagram, CLI↔LLM split, input/output table, prompt handoffs, artifact chain; docs links; no CLI/agent changes |
| VS-021 | Mermaid click-to-zoom | Docs-site lightbox for Mermaid diagrams (scroll/pinch zoom · drag pan · Esc close); docs only |
| VS-022 | Landing refresh | Landing "See it in action" section: 4 demo repos + prompt flows + Templates links (EN/ES); docs only |
| VS-023 | Visual Guide | Diagram-first docs page (EN/ES): knowledge loop, CLI↔LLM, sequence, artifact graph, project states, multirepo, Guard, governance, mindmap; docs only |
| VS-024 | Artifact examples in docs | git-strategy: example `.kaddo/git.yml` for gitflow/trunk-based/custom; standards/security/stack: starter + filled file examples (EN/ES); docs only |
| VS-025 | Align module generation | `kaddo modules map` renders module artifacts from the template registry: front matter + module metadata + `code:` globs + quality checklist; no-overwrite preserved; Guard unchanged |
| VS-026 | Module-aware context & explain | `context` + `explain` surface mapped modules from `.kaddo/modules.yml` with per-module artifact coverage; `mapped_modules` separate from `installed_modules`; no secondary-repo scan; Guard unchanged |
| VS-027 | Workspace Guard (multirepo) | opt-in `kaddo guard --workspace`: runs local `git diff` in mapped module repos, matches normalized cross-repo paths vs `code:` globs; non-blocking; skips missing/non-git repos; `--ci` workspace metadata; no remote APIs, no source reads; default guard unchanged |
| VS-028 | Project Knowledge Bootstrap | `kaddo bootstrap` for new projects: Business → Architecture → Codebase → Development knowledge base from the template registry; business/quality-attributes/codebase-foundation/bootstrap-summary templates; business/bootstrap/codebase-foundation agents; no LLM, no code gen, no-overwrite |
| VS-029 | Knowledge Repository Realignment | `architecture/` → `knowledge/`; macro layers Business → Product → Tech → Delivery; layer reorg (product/tech/delivery); templates recategorized; context/explain grouped by layer; bootstrap reduced to minimal base; docs + examples + manifesto realigned. Breaking (clean cut) |
| VS-030 | Bootstrap Minimal Artifacts & Agent Groups | bootstrap generates one consolidated file per layer (business.md/product.md/codebase.md), specialized templates kept as advanced; agents grouped by layer with progressive `add agents` (state default · `--all` · `--group`); `understand` shows current phase. Minimum Sufficient Knowledge |
| VS-031 | New Project Flow Hardening | agents install in per-layer folders; `new` recommends capability + architecture (+adr) agents; explain counts Work Items only under `delivery/work-items/` with a valid type (no ADRs/untyped); intent (`codebase.md`) vs reality (`current-state.md`) documented; command responsibilities + ownership flow docs; `understand` next steps |
| VS-035 | Work Item Delivery Workflow | official delivery lifecycle (Roadmap → Work Item → Branch → Implementation → Scan → Ownership → Guard → Knowledge → Review → Commit); `understand` shows it for active Work Items with suggested branch/commit; Guard-before-commit + knowledge-update guidance; docs + examples; Kaddo never runs git |
| VS-036 | Work-item branch in the implementing agent | branch-first is a configuration in the `work-item-agent` prompt (create the branch per the Git strategy before coding, so work never lands on `main`; commit only with human confirmation). The Kaddo CLI stays deterministic and never touches git (no `kaddo start` command) |
| VS-037 | Knowledge Discovery & Semantic Recognition | recognize knowledge by front-matter `type` (not path/name): discovery engine + per-layer maturity (Missing/Consolidated/Structured/Partial/Traceable); explain/understand/context recognize consolidated artifacts; understand recommends materializing roadmap candidates |

**Tests:** 299 passing · CLI build + docs build green.

---

## Optional modules (`kaddo add`)

Modules are optional — Core ships only what is needed to start.

| Module | Purpose | When to add |
|---|---|---|
| `adr` | Record architectural decisions | When decisions become recurring |
| `rfc` | Explore changes before building | When proposals need review first |
| `incident` | Document incidents and learnings | When there is production to learn from |
| `migration` | Manage data/infra/tech changes | When schema/infra migrations are frequent |
| `legacy` | Understand debt before changing it | When touching low-knowledge, high-debt systems |
| `contracts` | API/event/integration contracts | When services share contracts |
| `capabilities` | Map product capabilities to domains | When product/engineering alignment is needed |
| `guard-advanced` | CI rules, deeper analysis | After Guard Lite has proven value |
| `agents` | Reusable LLM agent prompts | When the Knowledge Repository is stable |
| `skills` | Reusable capabilities across agents | When agents are in use |
| `standards` · `security` · `stack` · `git-strategy` | Global architecture artifacts | When documenting cross-cutting concerns |

---

## Governance levels

| Level | Model | Explicit review |
|---|---|---|
| 1 — Indie | Developer → Knowledge | No owner |
| 2 — Small team | Developer → PR → Knowledge | Natural in PR |
| 3 — Medium team | Developer → Knowledge → Tech Lead by exception | ADR, RFC, Architecture Change |
| 4 — Enterprise | Domain Owners per domain | Each owner reviews their domain only |

---

## Build order (manifesto §21)

| Step | Deliverable | Status |
|---|---|---|
| 1 | Work Items + K-Levels | ✅ v1.0.0 |
| 2 | Ownership front matter | ✅ v1.0.0 |
| 3 | Guard Lite v1 | ✅ v1.0.0 |
| 4 | Ignore reason | ✅ v1.0.1 |
| 5 | `kaddo explain` | ✅ v1.1.0 |
| 5b | Transparent Evidence Score | ✅ v1.1.1 |
| 6 | Cheap Classification Drift (`classify`) | ✅ v1.2.0 |
| 7 | Semantic plugins | ✅ v2.1.0 |
| 8 | `kaddo understand` | ✅ v2.6 |
| 9 | Roadmap Agent + `create --from roadmap` | ✅ v2.6 |
| 10 | Guard Lite end-to-end | ✅ v2.6 |
| 11 | `kaddo owners suggest` | ✅ v2.6 |

---

## Out of scope (permanently or until explicitly decided)

- Web platform or dashboard
- Mandatory agents or skills as part of Core
- Mandatory LLM integration
- Complex Confidence Score (heuristic percentages)
- Strict CI by default
- Multiagent orchestration
- Blocking guard by default
