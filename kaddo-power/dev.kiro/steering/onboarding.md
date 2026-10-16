---
inclusion: auto
name: kaddo-onboarding
description: Use this Kaddo session workflow when selecting, refining, planning or implementing a Work Item.
---

# Kaddo Session Workflow

## 1. Assess project health

Read the recommended next step, project status and context pack through the installed Kaddo MCP
server. Surface missing knowledge, blocking questions, stale derived artifacts and whether the open
repository is a core or module repository.

Do not silently generate or change project knowledge. Derived `.kaddo/` artifacts may be regenerated
through Kaddo; authored knowledge requires human review.

## 2. Select the goal

Present relevant ready and draft Work Items to the human. Never auto-select a Work Item. If only
drafts exist, use the canonical `work-item-refinement` Skill, preview readiness and ask the human to
confirm the transition.

If integrations are configured (`.kaddo/integrations.yml`), read their status and present external
work items available for import. Import always requires a human-confirmed type — Kaddo never infers
the type from the external system.

If the project uses Initiatives, check initiative progress and suggest materializing pending
candidates when the roadmap points to them.

## 3. Refine and plan

Read the selected Work Item and applicable module context. Review all relevant product and technical
surfaces, preserve unknowns, and use graph traversal only to identify impact candidates for further
investigation.

For a ready Work Item, apply `implementation-planning`. The plan must state scope, expected files,
risks, validations, out of scope and stop criteria. Wait for human approval before changing code.

If the Work Item references Project Resources (`knowledge/tech/resources/`), read them to understand
access interfaces, boundaries and auth references — never credentials.

## 4. Implement and validate

Implement only confirmed scope. Pause when evidence requires a scope or architecture decision.
Validate acceptance criteria and use Kaddo Guard to detect knowledge drift. Never commit or push
without the human's explicit request.

When an in-progress Work Item is complete, apply the `evidence-verification` Skill (or use
`kaddo verify <id>`) to collect implementation evidence against acceptance criteria before
proposing closure. Evidence is persisted in the Work Item front matter under
`implementation_evidence`.

## 5. Capture learning

Apply `learning-capture`, review graph and ownership evidence, and propose updates to capabilities,
ADRs, current state or delivery knowledge. Open questions remain open until a human resolves them.

If new external systems were introduced during implementation, propose creating a Project Resource
under `knowledge/tech/resources/` to document them.

## Module repositories

Work Items remain owned by the core/system repository. In a module repository, refine local module
context, boundaries, interfaces and risks without duplicating global business or product knowledge.
