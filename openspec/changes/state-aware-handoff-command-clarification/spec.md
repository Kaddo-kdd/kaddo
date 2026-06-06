# Spec: State-Aware Handoff & Command Clarification

## Phase model
- Phases: Discovery, Planning, Delivery Preparation, Active Delivery, Maintenance.
- Determined from real knowledge: layers + roadmap + Work Items + ownership.
- `assessPhase` returns phase, reasons, recommendedAgents, nextStep.

## Consumers
- understand: recommends from real state (phase / reason / recommended / next step).
- context: exposes `phase` + `## Current Phase` section.
- explain: shows `## Phase` with reason.

## Command clarification
- Formal table for scan/context/explain/understand: purpose, input, output, question answered.
- Recommended order documented; Visual Guide diagram added.

## Out of scope
- New agents, Guard/Ownership changes, MCP, flow automation.

## Acceptance criteria
- **AC1** Recommendations are based on the real knowledge state.
- **AC2** understand stops recommending roadmap-agent once a roadmap exists.
- **AC3** understand identifies the current phase correctly.
- **AC4** context shows the current phase.
- **AC5** Formal definition of scan/context/understand/explain exists.
- **AC6** Official table with purpose/input/output/question per command.
- **AC7** Docs reflect the recommended order.
- **AC8** Examples reflect the correct flow.
- **AC9** Visual Guide updated.
- **AC10** Tests cover recommendations by roadmap/Work Items/ownership/Work Item state.
