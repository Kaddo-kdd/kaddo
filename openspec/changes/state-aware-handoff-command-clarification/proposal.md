# Proposal: State-Aware Handoff & Command Workflow Clarification (VS-047)

## Why

Validating `todoApp`, Kaddo already recognized an existing roadmap, current-state, materialized
Work Items and declared ownership — yet `understand`/`context` still recommended `roadmap-agent`
and `architecture-agent` as if the project were at an early stage. Recommendations were driven by
`project.state` alone, contradicting what Kaddo actually knew.

Validation also showed recurring confusion about `scan`, `context`, `understand` and `explain` —
what each is for, when to run it, what it produces and consumes.

## What

1. **State-aware recommendations**: a real-knowledge phase model
   (Discovery → Planning → Delivery Preparation → Active Delivery → Maintenance) computed from
   layers + roadmap + Work Items + ownership, with a reason and concrete next step.
2. `understand` and `context` recommend from this real state (not only `project.state`);
   `explain` shows the phase + reason.
3. **Command clarification**: a formal table (purpose / input / output / question answered) and
   recommended order for `scan`, `context`, `explain`, `understand`, plus a Visual Guide diagram.

## Impact

- Once a roadmap and Work Items exist, Kaddo stops recommending the roadmap-agent and points at
  the work that needs attention (e.g. "Start WI-014 (ready → in-progress)").
- The four orientation commands are unambiguous.
- Out of scope: new agents, Guard/Ownership changes, MCP, flow automation.
