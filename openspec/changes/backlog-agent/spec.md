# Spec: Backlog Agent

## Agent
- New `backlog-agent.md` prompt (9-section contract; references context pack).
- Responsibility matrix entry; in delivery group + recommended sets.
- Captures free text / bullets / notes / transcripts → Work Item draft OR roadmap candidate;
  splits multiple ideas.

## Boundaries
- No code, no full refinement, no automatic roadmap edits, no git, no auto-execution of other
  agents. Always ends with a human-decision handoff.

## Out of scope
- New CLI commands, roadmap automation, auto-implementation, Git integration, MCP.

## Acceptance criteria
- AC1 backlog-agent exists. AC2 accepts free text. AC3 accepts lists/notes.
- AC4 can produce a Work Item draft. AC5 can produce a roadmap candidate. AC6 can split multiple.
- AC7 does not implement code. AC8 does not execute other agents.
- AC9 always requires a human decision before the next step. AC10 docs/examples reflect the flow.
