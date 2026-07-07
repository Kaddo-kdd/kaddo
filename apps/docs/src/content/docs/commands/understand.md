---
title: kaddo understand
description: Guide the CLI → LLM handoff with a state-aware agent plan.
---

```bash
kaddo understand
```

Guides the handoff from the CLI (deterministic context) to your LLM (interpretation). It
refreshes the context pack, recommends which agents to use — in what order — based on your
project state, and writes a reusable guide you can re-open any time.

It writes / refreshes:

- **`.kaddo/context-pack.md`** and **`.kaddo/context-pack.json`** — the input for agents.
- **`.kaddo/understand.md`** — the state-aware handoff guide with the current phase, recommended
  agent/skill, delivery state, primary and secondary recommendations, active Work Items, concrete
  agent/skill paths, and copy/paste instructions. The markdown matches the console output (VS-079.1).

## What it does

1. Requires an initialized project (`kaddo init`).
2. Checks for a scan baseline (`.kaddo/scan.json`) — warns but continues if missing.
3. Generates / refreshes the context pack (reuses `kaddo context`).
4. Builds a state-aware agent plan and flags any agents not yet installed
   (`kaddo add agents`).
5. Prints a concise terminal summary and writes `.kaddo/understand.md`.

## Deterministic, no LLM

`kaddo understand` does **not** call an LLM, execute agents, or auto-generate architecture
artifacts. It prepares context and tells you exactly which agent to run next. You stay in
control of the interpretation.

## State-aware agent flow

## State-aware recommendations

`understand` recommends the next step from the **real** knowledge state — layers, roadmap, Work
Items and ownership — not only the `project.state` recorded by `kaddo init`. It reports the current
**phase**, the **reason**, the recommended agent(s) and a concrete **next step**:

```text
Current phase: Active Delivery
Reason:
  - Roadmap available
  - 1 materialized work item(s)
  - ready: 1
  - Ownership coverage 100%
Recommended: implementation-agent
Next step: Start WI-014 — Create task (ready → in-progress)
```

Phases are derived from what actually exists:

| Phase | When |
|---|---|
| Discovery | base layers missing (business / product / codebase) |
| Planning | base knowledge exists, no roadmap yet |
| Delivery Preparation | roadmap exists, no Work Items yet |
| Active Delivery | active Work Items exist (draft / ready / in-progress / blocked) |
| Maintenance | Work Items completed and the roadmap is mostly materialized |

So once a roadmap and Work Items exist, `understand` stops recommending the roadmap-agent and points
you at the work that actually needs attention.

The legacy state-based flow still informs early phases:

| State | Recommended flow |
|---|---|
| `new` | roadmap-agent → architecture-agent |
| `pre-ai` | capability-agent → architecture-agent → roadmap-agent |
| `legacy` | legacy-agent → architecture-agent → capability-agent → roadmap-agent |

Each step maps to an expected output, for example:

- `capability-agent` → `knowledge/product/capabilities.md`
- `architecture-agent` → `knowledge/tech/current-state.md`
- `roadmap-agent` → `knowledge/delivery/roadmap.md`
- `legacy-agent` → `knowledge/legacy/risks.md`

## Roadmap candidates → materialized Work Items

When a roadmap exists but its candidates are not yet Work Items, `understand` calls it out and
recommends materializing them:

```text
The roadmap has 16 unmaterialized Work Item candidate(s) (21 candidate(s), 5 materialized).
  → Run `kaddo create --from roadmap`, or use the work-item-agent to
    materialize them into knowledge/delivery/work-items/.
```

Candidates are detected from any [supported roadmap format](/commands/create/#supported-roadmap-formats).
A roadmap candidate becomes a real Work Item only when you create it — `understand` keeps that
boundary explicit so nothing is silently treated as in-flight work.

## Active work

`understand` reasons over the Work Item lifecycle and highlights the current active workspace:
`draft`, `ready`, `in-progress` and `blocked`. It recommends continuing an in-progress item,
starting a ready item, refining a draft, or resolving blockers. `completed` and `archived`
remain historical knowledge.

## Graph hints during Active Delivery

If the project is in the **Active Delivery** phase and
[`kaddo graph export`](/knowledge-graph-export/) has reported hints that affect **active** Work
Items, `understand` recommends reviewing them before continuing implementation and suggests the
`graph-agent`. The nudge only appears when hints touch active work — it stays out of the way
otherwise.

## Bootstrap alignment (VS-083 / VS-083.1)

When the knowledge baseline is incomplete (neither `knowledge/business/business.md` nor
`knowledge/product/product.md` exist), `understand` enters **Setup** mode:

- The project route marks the `bootstrap` step as current.
- The phase is reported as **Setup** instead of Discovery.
- Agent handoff sections (Agent Prompts, Expected Outputs, Copy/Paste) are suppressed —
  agents cannot produce useful output without baseline knowledge.
- The terminal and markdown guide show a numbered bootstrap sequence:
  1. `kaddo bootstrap` → 2. `kaddo add agents` → 3. `kaddo add skills` → 4. `kaddo context` → 5. `kaddo understand`.

Once both baseline files exist, the normal phase-aware flow resumes.

## Self-recommendation guard (VS-083.3)

`understand` never recommends itself ("run `kaddo understand`") when actionable refinement
steps exist. Before v3.53.0, the priority ladder checked for `understand.md` existence
before checking knowledge quality — so on the first run, `understand` always self-recommended
instead of pointing to the actual next agent.

Now refinement checks run first: if `business.md` is a placeholder, the recommendation is
`refine-business` with `business-agent`, not "run `kaddo understand`". The `understand` fallback
only fires when all knowledge layers are useful and no `understand.md` exists yet.

This also fixes `projectRoute.currentStep`: it now correctly shows `define-business` instead
of `scan-repository` when business knowledge needs refinement.

## Knowledge refinement handoff (VS-083.2)

After the bootstrap baseline exists but a knowledge file is still a placeholder or too thin,
`understand` recommends a **Knowledge Refinement** step with the specific agent needed:

- The recommendation includes `agentPath`, `agentInstalled`, and `installCommand`.
- If the recommended agent is **not installed**, the markdown guide shows a
  **Missing Agent** section with the install command instead of Agent Prompts.
- If the agent **is installed**, the markdown shows the agent prompt path in the
  Agent Prompts section.
- The context pack's Recommended Agent Handoff section also reflects agent install status.

## Works even when context is incomplete

If the scan baseline or some agents are missing, the command still produces a plan and
tells you the next concrete step (run `kaddo scan` or `kaddo add agents`).

## scan vs context vs understand

- **`scan`** collects deterministic technical signals.
- **`context`** packages those signals (plus knowledge and work items) into an LLM-ready pack.
- **`understand`** ties it together: refreshes the pack and tells you which agent to run
  next, in what order, for your project state.

## Markdown handoff alignment (VS-079.1)

Since v3.46.0, `.kaddo/understand.md` reflects the same state-aware recommendation as the console
output. It includes:

- **Current Phase** — phase, recommended agent/skill, next step and reason.
- **Delivery State** — draft/ready/in-progress/blocked counts, ownership coverage, remaining
  candidates, decision candidates, ADRs, adapters.
- **Primary Recommendation** — the single next step with id, agent, skill, command and reason.
- **Secondary Recommendations** — parallel suggestions (ownership, ADRs, remaining candidates).
- **Active Work Items** — Work Items in draft/ready/in-progress/blocked.
- **Agent Prompts** — concrete paths to the recommended agent and skill files plus the context pack.
- **Expected Outputs** — what the LLM should produce for the recommended step.

No section is rendered empty — if data is not available, it is omitted or shows a fallback.

## Agent output metadata preservation (VS-084)

When agents refine knowledge files created by `kaddo bootstrap`, they must preserve the YAML
frontmatter metadata (`type`, `generated_by`, `template_version`). Agents that rewrite
knowledge files automatically receive **Frontmatter Rules** in their prompt that instruct them
to:

- Preserve existing frontmatter fields.
- Not remove `type`, `generated_by`, or `template_version`.
- Set `project_state: ai-assisted` when the document is no longer a placeholder.
- Add or update `refined_by` with the agent name.

A separate **metadata health** analyzer detects drift — missing required fields or
inconsistent `project_state` after refinement. Metadata health is independent of content
quality: a file with useful content but drifted metadata is still classified as useful by
the content quality analyzer.

Metadata health warnings appear in:

- `context-pack.json` (`metadataHealth` field) and `context-pack.md` (Metadata Health section).
- `.kaddo/understand.md` and the terminal output of `kaddo understand`.
- `kaddo explain` (human and agent modes).
- `kaddo guard` output.

## Example

```text
Kaddo Understand

Project: demo
State: pre-ai
Team: indie
Structure: monorepo

Recommended flow:
  1. capability-agent → knowledge/product/capabilities.md
  2. architecture-agent → knowledge/tech/current-state.md
  3. roadmap-agent → knowledge/delivery/roadmap.md

First step: use capability-agent.

  Context:         .kaddo/context-pack.md
  Agent prompt:    knowledge/agents/product/capability-agent.md
  Expected output: knowledge/product/capabilities.md

Kaddo does not call an LLM. You stay in control of the interpretation.
```
