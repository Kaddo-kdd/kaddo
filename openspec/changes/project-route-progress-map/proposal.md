# Proposal: Project Route Progress Map (VS-080)

## Why

Users need a visual, at-a-glance understanding of where their project sits in the KDD lifecycle.
The existing next-step recommendation tells you *what* to do next but not *where* you are in the
overall journey. A route progress map closes that gap.

## What

Add a deterministic `buildProjectRoute(dir)` function that evaluates each lifecycle step against
real project state and returns a typed `ProjectRoute` object with step statuses (done, current,
next, pending, warning, blocked, skipped, optional). Three route definitions cover new, pre-ai,
and legacy project types.

Integrate the route into explain (full checklist), context-pack (compact summary), understand
(compact summary), and MCP (`kaddo://project-route` resource).

## Acceptance criteria

- AC1-3: Routes build for new, pre-ai, and legacy project types.
- AC4-9: Route shape includes type, currentStep, completed, total, progressPercent, steps.
- AC10-17: Steps include id, label, status and optional evidence, reason, command, agent, skill.
- AC18-26: Step evaluators correctly assess project state (scan, business, product, capabilities,
  architecture, decisions, work items, ownership, guard history).
- AC27: currentStep aligns with nextStepRecommendation.
- AC28-30: Markdown rendering includes full checklist and compact summary.
- AC31-35: Integration with explain, context-pack, understand, and MCP.
- AC36-40: No LLM calls, no git mutations, pure deterministic evaluation.
- AC41-45: EN/ES doc parity, OpenSpec files, version bump, tests pass.
