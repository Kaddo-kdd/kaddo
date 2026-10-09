---
type: spike
id: WI-041
title: Add Proof of Concept project mode
knowledge_level: K3
status: completed
phase: now
work_type: spike
initiative: null
domains:
  - Product
  - Tech
  - Delivery
code:
  - packages/cli/src/core/config.ts
  - packages/cli/src/core/poc.ts
  - packages/cli/src/core/next-step.ts
  - packages/cli/src/core/project-route.ts
  - packages/cli/src/core/context-pack.ts
  - packages/cli/src/commands/init.ts
  - packages/cli/src/commands/bootstrap.ts
  - packages/cli/src/commands/project.ts
  - packages/mcp/src/resources.ts
  - packages/admin-server/src/
  - packages/admin/src/
  - apps/docs/
created_at: 2026-10-09T00:00:00.000Z
source:
  type: manual
  inferred: false
generated_by: kaddo-create
template_version: 1
summary: >-
  Kaddo has no operating mode for a bounded Proof of Concept, so teams are
  forced through roadmap-oriented guidance when they need to validate a
  hypothesis with evidence
affected_modules:
  - core
scope_confidence:
  level: high
  reasons:
    - >-
      The change is intentionally bounded to Kaddo configuration, guided flow,
      interfaces, tests, and documentation.
refined_by: work-item-refinement (manual)
ready_at: '2026-10-09'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/config.ts
        - packages/cli/src/core/poc.ts
        - packages/cli/src/core/next-step.ts
        - packages/cli/src/core/project-route.ts
        - packages/cli/src/core/context-pack.ts
        - packages/cli/src/commands/init.ts
        - packages/cli/src/commands/bootstrap.ts
        - packages/cli/src/commands/project.ts
        - packages/mcp/src/resources.ts
        - packages/admin-server/src/
        - packages/admin/src/
        - apps/docs/
      validations:
        - command: >-
            pnpm vitest run packages/cli/tests/poc-mode.test.ts
            packages/cli/tests/config.test.ts
            packages/cli/tests/project-route.test.ts
            packages/mcp/tests/poc-resource.test.ts --config vitest.config.ts
          status: passed
          reason: 32 focused CLI and MCP tests passed.
        - command: >-
            pnpm --filter @kaddo/cli build && pnpm --filter @kaddo/admin-server
            build && pnpm --filter @kaddo/admin build && pnpm --filter
            @kaddo/mcp build && pnpm --filter @kaddo/docs build
          status: passed
          reason: >-
            CLI, Admin Server, Admin, MCP, and documentation builds passed; CLI
            and MCP were run sequentially.
        - command: 'pnpm npm-readme:check && pnpm agent-plugin:check && git diff --check'
          status: passed
          reason: >-
            Generated README and agent-plugin skills remain synchronized and the
            staged diff has no whitespace errors.
implementation_status: completed
validation_status: passed
verified_at: '2026-10-09'
completed_at: '2026-10-09'
---

# Add Proof of Concept project mode

> Type: spike · Level: K3

## Problem

Kaddo has no operating mode for a bounded Proof of Concept, so teams are forced through roadmap-oriented guidance when they need to validate a hypothesis with evidence.

## Impact

Teams cannot distinguish exploratory work from product delivery, making context, route, and documentation recommend unnecessary planning artifacts.

## Scope

1. Add `project.mode` as an orthogonal Core contract with `standard` as the compatible default and `poc` as the focused experiment mode.
2. Expose the mode from CLI initialization and configuration, POC bootstrap, next-step guidance, project route, context pack, MCP, and Admin.
3. Provide one canonical POC artifact with hypothesis, success criteria, constraints, non-goals, evidence, and conclusion.
4. Document the POC route in English and Spanish and retain the standard roadmap workflow for non-POC projects.

## Acceptance criteria

- [x] Configuration supports `standard` and `poc` modes without changing `project.state`; missing mode resolves to `standard`.
- [x] Init, bootstrap, next-step, route, context pack, MCP, and Admin honor POC mode without requiring a roadmap or capability map.
- [x] The canonical POC artifact represents hypothesis, success criteria, constraints, non-goals, evidence, and conclusion states.
- [x] Documentation and automated tests cover the POC workflow and backward compatibility.

## Design

Add an orthogonal ProjectMode contract in Core, preserve standard defaults, and expose a focused POC artifact and route across CLI, context, MCP, Admin, and docs.

## Out of scope

- Changes to the existing `ProjectState` taxonomy or Work Item lifecycle.
- Automatic LLM execution, token metrics, prompt compression, or production POC execution.
- A new CLI command for moving a Work Item from ready to in-progress.

## Validation

- `pnpm vitest run packages/cli/tests/poc-mode.test.ts packages/cli/tests/config.test.ts packages/cli/tests/project-route.test.ts packages/mcp/tests/poc-resource.test.ts --config vitest.config.ts` — 32 tests passed.
- `pnpm --filter @kaddo/cli build`, `pnpm --filter @kaddo/admin-server build`, `pnpm --filter @kaddo/admin build`, `pnpm --filter @kaddo/mcp build`, and `pnpm --filter @kaddo/docs build` passed.
- `pnpm npm-readme:check`, `pnpm agent-plugin:check`, and `git diff --check` passed.

## Implementation handoff

### Context summary

Reviewed the Work Item, the staged implementation across CLI, MCP, Admin, and docs, the existing multirepo module map, and the available semantic graph. The change spans the Kaddo Core contract plus its projections; it does not require an external Project Resource or a new ADR.

### Technical approach and rationale

Add `ProjectMode` to the Core configuration schema with a backward-compatible `standard` default. Keep it independent from `ProjectState`, then derive POC-specific baseline templates, route steps, next-step recommendations, context-pack content, MCP visibility, and Admin configuration from that mode. This preserves existing project maturity semantics while allowing a bounded evidence-first route.

### Alternatives and trade-offs

Adding `poc` to `ProjectState` would overload maturity with intent and alter existing state-aware behavior. A separate mode adds a small configuration field and conditional route, but keeps standard projects and their roadmap flow unchanged.

### Affected areas

CLI/Core configuration and commands, context and understand outputs, MCP resources, Admin API/UI, documentation, and focused automated tests.

### Validation plan

Run the focused CLI/MCP tests, package builds, documentation build, README and agent-plugin consistency checks, staged Guard, and `kaddo verify WI-041`.

## Definition of Done

- [x] Problem is clear.
- [x] Impact is stated.
- [x] Acceptance criteria are verifiable.
- [x] Design is sufficient to start.
- [x] Implementation and validation evidence are recorded.

## Learning

Project mode should stay orthogonal to project state: a small canonical POC artifact can guide an evidence-first experiment without forcing roadmap-oriented product planning.
