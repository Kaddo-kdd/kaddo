---
title: KDD Manifesto
description: Knowledge Driven Development — Manifesto v2.5 — foundational, runtime efficient, and minimum context.
---

> **Manifesto v2.5** — foundational manifesto, efficient runtime, and minimum context.

This version preserves the v2.4 vision and recovers product pieces that add value:
open source contribution, extension contracts, explanation commands, lifecycle
outputs, and an explicit separation between current and historical state.

## 1. Overview

Kaddo is an open source toolkit based on Knowledge Driven Development (KDD) to help
teams create, evolve, and maintain digital products using structured knowledge,
living architecture, and artificial intelligence.

Kaddo is not meant to be just a boilerplate for AI agents. It also does not seek to
replace agent frameworks, specification systems, orchestration platforms, or
management tools. Kaddo seeks to turn new projects, existing pre-AI projects, and
legacy systems into more understandable, governable, and evolvable products.

The central idea is: **Classify → Capture → Structure → Build → Learn.**

The goal is not to generate more documentation. The goal is to preserve the minimum
sufficient knowledge so that humans and AI can build software with less ambiguity,
less rework, and more traceability.

## 2. The problem it solves

Many projects fail or degrade because knowledge is scattered across meetings, chats,
tickets, emails, code, people, outdated documents, decisions no one remembers, and
legacy systems with no clear context.

With AI, this problem becomes more critical. If the agent has no context, it builds
on assumptions. The quality of AI output depends directly on the quality of the
available knowledge.

That is why Kaddo does not put AI at the start of the process. First it organizes
knowledge. Then it lets AI help build.

## 3. North star

Kaddo's central question is: **how does Kaddo know that the correct knowledge was
impacted by this change?**

Everything else —work items, K levels, modules, agents, skills, and guardrails—
exists to answer that question better and better without turning development into
bureaucracy.

## 4. Core principle

Knowledge guides the evolution of the product.

```
Knowledge → Context → Architecture → Decisions → Roadmap → Work Items → Code → Learning → Updated knowledge
```

Agents, models, and tools can change; the product's knowledge must survive all of them.

## 5. Differentiator vs installable MVP

v2.2 made Kaddo's differentiator more honest, but it also raised the bar for the MVP.
This version separates two different things: what makes Kaddo special in the long run,
and the minimum that is already worth installing.

| Layer | Purpose | Must be in v1 |
|---|---|---|
| Long-term differentiator | Knowledge Graph, intelligent Guard, observed classification, semantic change analysis. | Not complete. Must evolve in stages. |
| Installable MVP | Classification, Knowledge Levels, Work Items, and Guard Lite based on declared globs. | Yes. Must be simple, useful, and quick to build. |
| Later modules | Confidence/Evidence Score, advanced Classification Drift, strict CI, enterprise domain ownership. | No. They should arrive once Core is useful. |

Kaddo must not delay its first launch waiting to solve the whole problem. The first
installable value must be small: detect that files associated with an artifact were
touched and suggest reviewing that artifact.

## 6. Initial project scope

The initial scope must be deliberately small. Kaddo should not start as a complete
framework, but as a minimal base that validates whether observable knowledge improves
software evolution.

### 6.1 Core v1

| Piece | Responsibility in v1 | Expected complexity |
|---|---|---|
| Classification | Allow declaring the type of change and suggest an initial K level. | Low |
| Knowledge Levels | Define how much information is needed based on impact and risk. | Low |
| Work Items | Turn a change intent into a clear, actionable, traceable unit. | Low |
| Guard Lite v1 | Cross git diff against globs declared in artifacts and show an FYI if the artifact did not change. | Low-medium |

### 6.2 Not fully included in v1

- Sophisticated Confidence Score.
- Classification Drift with semantic analysis.
- Semantic diff of API contracts, schemas, or events.
- Strict CI rules.
- Complete enterprise Domain Ownership.
- Agents and skills as a base requirement.

## 7. Kaddo Core and modules

Kaddo Core must include only what is needed to start. Everything else grows out of
need, not by default.

```
architecture/
  roadmap.md
  knowledge.md
  work-items/
.kaddo/
  config.yml
```

| Module | Purpose |
|---|---|
| ADR Module | Record architectural decisions when risk justifies it. |
| RFC Module | Explore relevant changes before building them. |
| Migration Module | Manage data, infrastructure, or technology changes with more rigor. |
| Incident Module | Document incidents, learnings, and preventive actions. |
| Legacy Module | Understand systems with technical debt or low knowledge before modifying them. |
| Contracts Module | Add API, event, or integration contracts. |
| Capabilities Module | Map product capabilities and relate them to domains, work items, and decisions. |
| Guard Advanced Module | Add Evidence Score, Classification Drift, CI rules, and deeper analysis. |
| Agents Module | Add reusable agents once the team already has enough structure. |
| Skills Module | Add reusable capabilities across agents, teams, or projects. |

## 8. Main concepts

### 8.1 Knowledge Repository

It is the set of files that preserve the product's knowledge. It can live inside the
same repository or in a dedicated architecture repository. In Core, the minimum
structure must be small; modules add folders when complexity justifies it.

### 8.2 Knowledge Ownership Model

Ownership should not live in a central file that can also drift. Each artifact declares
what it protects through front matter. This lets Kaddo build a distributed graph
without creating a fragile meta-artifact.

```yaml
---
type: adr
id: ADR-004
domains:
  - payments
capabilities:
  - payment-processing
code:
  - src/payments/**
  - src/shared/payment/**
---
```

This model lets each new artifact be born with its relationships. There is no central
`payments → ADR-004` file that someone must maintain manually.

### 8.3 Knowledge Graph

The Knowledge Graph is the graph built from the ownership declared in each artifact.
In v1 it can be simple: artifacts → code globs. Over time it can incorporate domains,
capabilities, contracts, owners, and runtime signals.

```
Artifact → Domain → Capability → Code
ADR-004 → payments → payment-processing → src/payments/**
```

The graph is the long-term differentiator, but it must not block the MVP. In v1 it is
enough for Kaddo to read globs declared in artifacts and cross them with git diff.

### 8.4 Governance by Exception

Everyday knowledge does not require approval. Only architectural, strategic, or
high-risk changes require explicit review. Kaddo does not assume every project needs a
Process Owner.

| Level | Governance model | Explicit review |
|---|---|---|
| Level 1 — Indie | Developer → Knowledge | No Owner. |
| Level 2 — Small team | Developer → PR → Knowledge | No Owner. Review happens naturally in the PR. |
| Level 3 — Mid-size team | Developer → Knowledge → Tech Lead by exception | Only ADR, RFC, and Architecture Change. |
| Level 4 — Enterprise | Domain Owners per domain | Each owner reviews only changes in their domain. |

### 8.5 Minimum Sufficient Knowledge as a system

Minimum Sufficient Knowledge must not remain an abstract concept. In Kaddo it
materializes as Knowledge Levels. The rule stays: do not ask for documentation, ask
for answers.

| Level | When it applies | Required knowledge |
|---|---|---|
| K0 | Trivial changes: CSS, text, minor visual bug. | No additional knowledge required. |
| K1 | Hotfix or simple fix. | Problem and expected result. |
| K2 | Feature or bugfix with functional impact. | Problem, expected result, impact, and acceptance criteria. |
| K3 | Capability, integration, or relevant functional change. | Problem, impact, acceptance, and design. |
| K4 | Architecture Change, migration, high-risk decision. | Problem, impact, design, ADR, and risks. |

### 8.6 Work Item

Kaddo uses the Work Item as the minimum unit of traceable change. Not everything must
be a vertical slice.

| Work Item type | Suggested level |
|---|---|
| Minor visual bug | K0 |
| Hotfix | K1 |
| Functional bugfix | K2 |
| Feature | K2 |
| Capability | K3 |
| Spike | K2 or K3 |
| RFC | K3 |
| Migration | K4 |
| Architecture Change | K4 |
| Incident | K2 or K3 depending on impact |

## 9. Guard Lite v1

Guard Lite v1 is the dumbest Guard that is already worth installing. Its job is not to
understand the system semantically. Its job is to detect simple intersections between
modified files and globs declared in artifacts.

```
git diff
  ↓
read globs declared in artifacts
  ↓
if a modified file matches an artifact and the artifact did not change
  ↓
show FYI
```

| Rule | Decision |
|---|---|
| No Confidence Score in v1 | Avoids falsely precise percentages. |
| No semantic Classification Drift in v1 | Only cheap and explicit signals. |
| Does not block by default | Only informs. |
| Does not alert if there is no declared ownership | Avoids noise in young repos. |
| Allows ignoring with a reason | Turns false positives into learning. |

### 9.1 Guard Lite v1 example

```
Touched files:
- src/payments/payments.service.ts

Matched ownership:
- ADR-004 declares src/payments/**

ADR-004 was not modified in this commit.
FYI: review whether ADR-004 still reflects the implementation.
```

This message already adds value without promising advanced intelligence. It is simple,
understandable, and actionable.

## 10. Cold-start strategy

The Knowledge Graph is empty precisely when the project is young or when Kaddo is
installed for the first time. That is why Guard must not shout from day one.

### 10.1 Greenfield / Level 1

In young repos, Guard Lite starts silent. It only speaks when there is at least one
artifact with declared ownership. If there is no ownership, there is no alert.

| Repo state | Guard Lite behavior |
|---|---|
| No artifacts with ownership | Silent. May suggest creating the first Work Item or artifact, but does not alert. |
| With 1+ artifacts with globs | Only alerts when git diff touches those globs. |
| With growing ownership | The graph improves incrementally. |

### 10.2 Brownfield / Pre-AI / Legacy

In existing projects, Kaddo must not require mapping the whole system before using it.
That contradicts graceful degradation. The graph is built incrementally: you declare an
artifact's ownership the next time you touch its domain, not all at once.

```
Rule: touch the domain, improve the graph.
Not a rule: map the whole company before writing code.
```

## 11. Evidence Score, not a magic percentage

v2.2 used Confidence Score. This version redefines it as Evidence Score to avoid false
precision. Guard should not show a naked percentage if the number comes from simple
heuristics.

| Poor output | Preferred output |
|---|---|
| Confidence: 92% | Evidence: 3/3 globs matched; artifact K4; related capability: payment-processing. |
| Suggested Architecture Change, 87% | Observed signals: migration file added; contract glob changed; dependency changed. |

### 11.1 Simple and transparent formula for later versions

```
Evidence Score = observed_signals / configured_signals

Example:
- 3 of 4 configured signals present
- Related artifact is K4
- Critical domain: payments

Result: strong evidence, not "statistical confidence".
```

The number should only appear alongside its explanation. If it cannot explain the
score, it must not show it.

## 12. Classification Engine and Classification Drift

Classification must combine what the developer declared with signals observed in the
diff. In v1, observed signals must be cheap and high-signal; deep semantic diff is left
for later versions.

### 12.1 Declared classification vs observed signals

```
Declared Classification: Bugfix

Observed Signals:
- Supabase migration file added
- API contract glob changed
- Dependency changed

Suggested Review:
This may be more than a Bugfix. Consider Feature, Migration or Architecture Change.
```

Kaddo does not replace the human decision. It contrasts what was declared with what was
observed and shows the disagreement when there are enough signals.

### 12.2 Cheap signals for v1

| Signal | How to detect it in v1 | Possible implication |
|---|---|---|
| Database migration | New/changed file in supabase/migrations, prisma/migrations, db/migrations. | K4 or Migration. |
| API contract | Change in globs declared as contracts/**, openapi.*, route schemas. | K3/K4 depending on impact. |
| Event contract | Change in events/** or schemas/** globs. | K3/K4. |
| Dependencies | Change in package.json, lockfile, requirements.txt, pom.xml, etc. | K2-K4 depending on domain. |
| Infrastructure | Change in terraform, cloudformation, serverless.yml, amplify, docker, k8s. | K3/K4. |
| Critical domain | Modified file matches an artifact marked critical: true. | Raises severity. |

### 12.3 Semantic diff is left for later

Detecting that an OpenAPI contract, an event schema, or a destructive migration changed
semantically requires per-stack analyzers. That must not be a promise of Core v1. It
should live in Guard Advanced or per-ecosystem plugins.

## 13. Diff Analysis Core

Knowledge Drift, Classification Drift, and the Classification Engine must not implement
three different readings of the same git diff. They must share a single engine: Diff
Analysis Core.

```
git diff
  ↓
Diff Analysis Core
  ├─ Knowledge Drift: did you touch protected code without touching related knowledge?
  └─ Classification Drift: does what you declared match the observed signals?
```

| Consumer | Question it answers |
|---|---|
| Knowledge Drift | Did you update the correct knowledge when you touched related code? |
| Classification Drift | Does the declared classification seem consistent with the change's signals? |
| Classification Engine | What K level and Work Item type are initially suggested? |

## 14. Guard Advanced

Guard Advanced is the evolutionary path, not the requirement to launch. It should grow
after validating that Guard Lite already adds value.

| Version | Capability |
|---|---|
| v1.0 | Guard Lite: intersection of globs and artifacts. Non-blocking FYI. |
| v1.1 | Transparent Evidence Score based on configured signals. |
| v1.2 | Classification Drift with cheap signals: migrations, contracts, dependencies, infra. |
| v1.3 | Basic CI: PR comments without blocking. |
| v2.0 | Per-stack semantic diff via plugins. |
| v2.x | Enterprise rules, Domain Owners, strict CI per critical domain. |

## 15. Realistic CLI

The CLI must infer first and ask later, but it must not promise perfect domain
detection. In v1 it should detect the cheap stuff and ask for human confirmation on the
ambiguous.

| Detects automatically | Suggests for human confirmation |
|---|---|
| Stack, framework, dependencies, structure, migration folders, contract files, infra. | Domains, capabilities, domain criticality, initial ownership, relationship between artifact and code. |

```
kaddo scan

Detected:
- Next.js
- TypeScript
- Supabase
- src/app/**
- supabase/migrations/**

Suggested domains:
[ ] Payments
[ ] Orders
[ ] Identity

Confirm or edit?
```

This approach is less magical, but more honest. The real magic is not in guessing
everything; it is in asking little, learning incrementally, and not getting in the way.

## 16. Operational risks and counter-strategies

| Risk | Why it matters | Counter-strategy |
|---|---|---|
| MVP too expensive | Complete Knowledge Graph, Guard, and Classification Engine are hard and interdependent. | Separate the long-term differentiator from the MVP: Guard Lite v1 with globs. |
| Cold start | In young repos the graph is empty; Guard may stay mute or make noise. | Guard silent until declared ownership exists. |
| Front-loaded load in brownfield | Mapping everything upfront contradicts graceful degradation. | Incremental graph construction when touching domains. |
| False authoritative score | Heuristic percentages erode trust. | Explained Evidence Score; show signals, not magic numbers. |
| Expensive Observed Classification | Requires per-stack analyzers. | Start with cheap signals and later plugins. |
| Double diff implementation | Knowledge Drift and Classification Drift can duplicate logic. | Shared Diff Analysis Core. |

## 17. Quality Gates and Definition of Done

A Quality Gate validates knowledge sufficiency, not amount of documentation. The goal
is to confirm the change has the minimum necessary context for its K level.

| Level | Suggested Quality Gate |
|---|---|
| K0 | No gate. |
| K1 | Clear problem and expected result. |
| K2 | Verifiable acceptance criteria. |
| K3 | Sufficient design, known effects, and related artifacts reviewed if they exist. |
| K4 | ADR, risks, alternatives considered, mitigation/rollback, and domain owner if applicable. |

A Work Item is done when the code works, the relevant tests pass, and the affected
knowledge is updated or explicitly marked as not impacted.

## 18. Adoption levels

| Level | Goal | Governance | Guard |
|---|---|---|---|
| Level 1 — Indie | Clarity and persistent context. | No owner. | Silent until declared ownership. |
| Level 2 — Small team | Coordination and basic traceability. | PR as natural review. | Local FYI or PR warning. |
| Level 3 — Mid-size team | Alignment between product and architecture. | Tech Lead by exception. | Warnings per domain/artifact. |
| Level 4 — Enterprise | Light governance, risk management, and continuity. | Domain Owners. | Rules per domain, optionally strict CI. |

## 19. Suggested metrics

- Time from request to classification.
- Time from classification to work item.
- Number of changes per Knowledge Level.
- Number of artifacts with declared ownership.
- Number of Guard Lite alerts.
- Ignored alerts and ignore reason.
- Changes with sufficient knowledge.
- Changes with rework.
- Onboarding time.
- Human time invested in structuring knowledge vs time saved by reduced ambiguity and rework.

## 20. Positioning

Kaddo occupies a different layer within the ecosystem:

```
Execution tools
      ↓
Agent frameworks
      ↓
Specifications
      ↓
Kaddo
      ↓
Product knowledge
```

| Framework | Question it answers |
|---|---|
| BMAD | How do agents collaborate? |
| Gentle-AI | How to improve agent environments? |
| OpenSpec | How to document software evolution? |
| Spec-Kit | How to structure specs and planning? |
| Kiro | How to turn specifications into implementation? |
| Claude Flow | How to orchestrate multiple agents? |
| GSD | How to ship faster with AI? |
| Kaddo | How to preserve and evolve the correct knowledge when code changes? |

## 21. Recommended build order

If Kaddo started tomorrow, the right order would not be to build the whole
differentiator. It would be to build the shortest path to observable value.

| Step | Deliverable | Why it goes first |
|---|---|---|
| 1 | Work Items + K-Levels | Allows classifying changes and asking for the minimum context. |
| 2 | Ownership front matter | Allows declaring what each artifact protects without a central file. |
| 3 | Guard Lite v1 | Delivers immediate value with glob intersection. |
| 4 | Ignore reason | Turns false positives into learning. |
| 5 | Transparent Evidence Score | Improves signal without inventing precision. |
| 6 | Cheap Classification Drift | Contrasts declared classification with simple signals. |
| 7 | Semantic plugins | Adds per-stack intelligence once there is an installed base. |

## 22. Manifesto, Boilerplate, and Runtime Context

The manifesto is not designed to be loaded in full into every project, agent, or CLI
execution. Its function is foundational: it defines the philosophy, constraints,
principles, and design decisions that support building Kaddo.

Kaddo must distinguish between foundational principles and operational context.
Confusing those two layers would produce large prompts, slow agents, and projects full
of documentary noise.

| Layer | Purpose | Where it lives | Expected use |
|---|---|---|---|
| Manifesto | Defines why Kaddo exists, what problem it solves, and which principles it must not break. | Kaddo project's main documentation. | Human reference and design guide for the CLI, boilerplate, and modules. |
| Boilerplate | Defines how a Kaddo project starts with minimal structure. | User's project when running kaddo init. | Installs Core, minimal templates, and base config. |
| Runtime Rules | Turns the manifesto's principles into small operational rules. | .kaddo/rules.md | Loaded in CLI operations and in agents when needed. |
| Project Knowledge Repository | Preserves the product's specific knowledge. | architecture/ and installed modules. | Living source for work items, artifacts, and learning. |
| Context Selection | Decides what knowledge enters a specific execution. | Diff Analysis Core + Knowledge Graph. | Avoids loading the whole repository and selects only the relevant. |

```
Manifesto → CLI design → Boilerplate → Runtime Rules → Project Artifacts → Context Selection → Agent or Human Action
```

**Design rule:** Kaddo must not confuse founding principles with runtime context.

## 23. Token Efficiency

Kaddo must not optimize only documentation quality. It must also optimize context
efficiency. A living knowledge system fails if answering one question requires loading
the whole knowledge repository.

The full manifesto must not be the payload of every interaction. At runtime, Kaddo must
use a compact version of operational rules, artifact metadata, summaries, related globs,
and a summarized diff.

The central rule is: **Full documents are loaded only when metadata and summaries are insufficient.**

| Prefer | Avoid |
|---|---|
| Metadata over full documents. | Loading all ADRs, RFCs, work items, or the full roadmap by default. |
| Summaries over full artifacts. | Sending large diffs without summarizing or filtering. |
| Related artifacts over global context. | Using the full manifesto as an operational prompt. |
| Deterministic analysis before LLM calls. | Using AI to detect what the filesystem and git can already tell. |
| Small, explainable context windows. | Exhaustive context that increases cost, latency, and noise. |

| Flow | Recommended budget | Strategy |
|---|---|---|
| kaddo guard v1 | 0 LLM tokens in normal mode; 150-400 tokens if generating a PR explanation. | Git diff + globs + front matter. Deterministic rule first. |
| kaddo scan | 0 tokens to detect stack, framework, dependencies, and structure; 300-800 if an assisted summary is requested. | Filesystem and manifests before LLM. |
| K0/K1 | 0-250 tokens. | Trivial changes or simple hotfixes; do not load full artifacts. |
| K2 | 300-700 tokens. | Minimum context of problem, impact, and acceptance. |
| K3 | 800-1,500 tokens. | Sufficient design, dependencies, and related artifacts. |
| K4 | 1,500-3,000 tokens. | ADR, risks, alternatives, rollback or mitigation; only related artifacts. |

Kaddo must behave like a context selection engine. Its value is not in sending more
information to the agent, but in knowing which few hundred tokens it needs to act with
less ambiguity.

## 24. Current State vs Historical Knowledge

Kaddo must distinguish between knowledge that represents the product's current state and
artifacts that explain how that state was reached. This separation avoids loading
unnecessary history at runtime and avoids treating ADRs, vertical slices, or incidents
as if they were all current sources of truth.

The practical rule is: current state answers **what is true now**; the historical
answers **why and how it became true**.

| Layer | What it answers | Examples | Runtime use |
|---|---|---|---|
| Current State | What is true now about the product, architecture, capabilities, contracts, and modules. | knowledge.md, roadmap.md, capabilities.md, contracts/, module.md, .kaddo/config.yml, graph-index.json | First source to explain the project and select context. Must be small, curated, and current. |
| Decision History | Why a decision was made and what alternatives were discarded. | ADR, RFC, architecture decision notes | Loaded only if the change touches related artifacts or a decision needs explaining. |
| Change History | What changed, when it changed, and what was learned. | Work Items, Vertical Slices, migrations, incidents, release notes, learning.md | Consulted by range, domain, or related artifact; not loaded in full by default. |
| Operational History | What happened in production and how it was handled. | incidents/, runbooks/, postmortems, support notes | Loaded when the change touches operation, reliability, or domains with prior incidents. |

ADRs, RFCs, vertical slices, and incidents are not historical garbage; they are
evidence. But Kaddo must project what was learned into current-state files when a
decision changes the product's present.

```
Historical artifacts → Learning → Current State projection
ADR/RFC/VS/Incident → summary + ownership → knowledge.md / capabilities.md / contracts / module.md
```

When a historical artifact becomes obsolete, it must not be deleted. Its status should
change, for example: accepted, superseded, deprecated, or replaced-by. The current state
must point to the active artifact and, when needed, to the historical one that explains
the decision.

## 25. Lifecycle Outputs and Work Item Templates

The manifesto must not contain all detailed flows. The lifecycle outputs and per-change
flows should live as installable templates. Still, Kaddo must keep a minimal reference
to guide the boilerplate design.

| Phase | Suggested output | Purpose |
|---|---|---|
| Request | request.md | Capture need, requester, urgency, and expected impact. |
| Classification | classification.md | Declare change type, suggested K level, risk, and recommended flow. |
| Capture | capture.md | Gather minimum answers from business, architecture, development, or operations. |
| Structure | proposal.md, design.md, spec.md, tasks.md | Transform answers into actionable structure. |
| Plan | roadmap.md, dependencies.md, risk notes | Order execution, dependencies, risks, and exclusions. |
| Build | implementation + tests | Build respecting contracts, decisions, and acceptance criteria. |
| Validate | validation.md | Record technical and functional validation. |
| Release | release-notes.md, changelog.md | Explain what changed and what is delivered. |
| Run | runbook.md, monitoring notes | Observe operation and support. |
| Learn | learning.md | Record learning and update current state if applicable. |

```
templates/work-items/vertical-slice.md
templates/work-items/hotfix.md
templates/work-items/incident.md
templates/work-items/migration.md
```

## 26. CLI Product Roadmap

The first version of the CLI must stay small. However, Kaddo needs an explicit command
roadmap so it does not lose useful product capabilities that were in the initial vision.

| Version | Commands | Purpose |
|---|---|---|
| v1.0 | kaddo init, kaddo scan, kaddo create, kaddo guard | Install Core, detect basic structure, create Work Items, and alert by ownership/globs. |
| v1.1 | kaddo status, kaddo explain, kaddo learn | Show knowledge state, explain the project, and record learning. |
| v1.2 | kaddo classify, kaddo history | Contrast declared classification with cheap signals and query history by domain/artifact. |
| v2.x | kaddo guard --ci, kaddo explain --scope, semantic plugins | PR/CI integration, per-domain explanation, and advanced per-stack analysis. |

```
kaddo explain --for human
kaddo explain --for agent
kaddo explain --scope payments
kaddo explain --since last-release
```

## 27. Multirepo Module Descriptor

In multirepo projects, each repository or module must be able to declare its identity
without forcing the whole main architecture to be loaded. This can live in
architecture/module.md or .kaddo/module.yml.

| Field | Purpose |
|---|---|
| name | Name of the module or repository. |
| purpose | Why it exists within the system. |
| responsibilities | What capabilities or responsibilities it covers. |
| stack | Detected or defined stack. |
| dependencies | Relevant internal and external dependencies. |
| contracts | APIs, events, or integrations it exposes or consumes. |
| boundaries | Limits and things that are not the module's responsibility. |
| constraints | Technical, regulatory, or operational constraints. |
| ownership | Domain, team, or responsible parties if applicable. |
| related-artifacts | Linked ADRs, RFCs, incidents, or Work Items. |

## 28. Open Source Contribution Model

Kaddo must be extensible without becoming a messy collection of prompts, templates, and
agents. The community must be able to contribute, but each contribution must clearly
declare what it adds, when it is used, and how it is validated.

- Templates for new Work Item types or new documentation formats.
- Modules for ADR, RFC, incidents, migrations, contracts, capabilities, or specific domains.
- Optional agents and skills for teams that already have enough structure.
- Semantic analysis plugins per stack or ecosystem.
- Real examples of greenfield, pre-AI, legacy, monorepo, and multirepo projects.

## 29. Extension Contracts

Extension contracts prevent the ecosystem from growing inconsistently. They are not
bureaucracy; they are a minimal interface so Kaddo can install, validate, document, and
run extensions safely.

| Contract | Must declare |
|---|---|
| Module Contract | name, purpose, installed-files, commands, dependencies, config, maturity-level, uninstall-strategy, examples. |
| Template Contract | name, description, work-item-type, knowledge-level, required-inputs, optional-inputs, output-files, quality-checklist, example. |
| Agent Contract | name, role, goal, inputs, outputs, constraints, steps, done-criteria, failure-modes, example-prompts. |
| Skill Contract | name, capability, when-to-use, inputs, outputs, prompt-pattern, examples, anti-patterns, quality-checklist. |
| Plugin Contract | name, ecosystem, signals-produced, files-read, confidence/evidence-model, limitations, performance-cost. |

Extensions must be optional. No contract should turn Agents, Skills, or Plugins into a
Core requirement.

## 30. Conclusion

Kaddo must not try to solve the whole living-knowledge problem in its first version. It
must install fast, ask little, and add value from the first artifact with declared
ownership.

The hard-to-replicate advantage is not in generating ADRs, RFCs, agents, or skills.
Anyone can copy that. The advantage is in building, incrementally, a reliable answer to
the question: **how does Kaddo know that the correct knowledge was impacted by this
change?**

The MVP must be humble. The vision can be ambitious. That separation is what allows
launching without betraying the differentiator.
