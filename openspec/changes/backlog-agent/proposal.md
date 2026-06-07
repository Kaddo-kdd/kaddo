# Proposal: Backlog Agent (VS-050)

## Why

Real work generates ideas outside the roadmap — one-liners, bullet lists, meeting notes, chats,
transcripts. They are not refined Work Items yet, so they fit neither the roadmap-agent (which
turns capabilities into initiatives) nor the work-item-agent (which refines existing items). The
result is manual friction between "idea" and "structured knowledge".

## What

Add a **backlog-agent** prompt pack that captures raw input and turns it into Kaddo-compatible
backlog — a Work Item **draft** or a **roadmap candidate** — without refining or implementing.

- Answers "where should this idea live?", not "how is it implemented?".
- Inputs: free text, bullets, meeting notes, chats, transcripts (+ context pack / knowledge).
- Outputs: a draft under `work-items/draft/`, a `WI-CANDIDATE-XXX`, or several split items.
- Never writes code, never edits the roadmap automatically, never runs git, and **never
  auto-executes** the work-item-agent or implementation-agent — it always ends with a human
  decision handoff.
- Registered in the delivery agent group + recommended sets; responsibility matrix + Agent Trace.
- Docs + Visual Guide flow + examples (small idea → draft, large → candidate, multiple → split).

## Impact

- New work is captured naturally without breaking Kaddo's human-control principle.
- Out of scope: new CLI commands, roadmap automation, auto-implementation, Git integration, MCP.
