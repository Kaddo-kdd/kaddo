# Spec: Roadmap Agent Output

## User Story

As a Kaddo user, I want the roadmap-agent to generate a structured roadmap, so that I can
move from project understanding to candidate work items without losing context.

## Expected Behavior

After using `.kaddo/context-pack.md` + `architecture/agents/roadmap-agent.md` in an LLM
chat, the user should receive a roadmap intended to be saved as:

```txt
architecture/roadmap.md
```

The roadmap should contain initiatives, related capabilities, risks, dependencies and
candidate work items.

## Acceptance Criteria

### AC1 — Roadmap agent defines expected output
`roadmap-agent.md` must clearly state that its output should be saved as
`architecture/roadmap.md`.

### AC2 — Roadmap contains structured initiatives
Each initiative should include: goal, related capabilities, impact, risk, dependencies,
suggested knowledge level, candidate work items and open questions.

### AC3 — Roadmap contains candidate work items
The roadmap must include candidate work items that can later be converted into real Kaddo
Work Items.

### AC4 — Roadmap separates suggestions from decisions
The roadmap must make clear that generated initiatives are candidates, not final
commitments.

### AC5 — Roadmap marks assumptions
Any uncertain information must be marked as an assumption or open question.

### AC6 — Roadmap avoids code generation
The roadmap-agent must not generate implementation code.

### AC7 — Roadmap works with incomplete context
If capabilities or architecture artifacts are missing, the agent should still produce a
minimal roadmap and clearly mark missing context.

### AC8 — Docs explain roadmap workflow
Docs should explain:
`context pack → roadmap agent → architecture/roadmap.md → future create from roadmap`.

### AC9 — Tests validate prompt pack
Update agent prompt tests to ensure `roadmap-agent.md` includes required roadmap sections
(initiatives, candidate work items, knowledge levels, assumptions/open questions, project
states).

## Edge Cases

- **No capabilities file** — infer cautiously from context pack and mark assumptions.
- **No architecture baseline** — include an open question asking for architecture validation.
- **Legacy project** — prioritize risk reduction, unknowns and safe modernization before
  feature delivery.
- **New project** — prioritize foundational capabilities and initial product direction.
- **Pre-AI project** — prioritize organizing existing capabilities and reducing knowledge
  gaps.

## Validation

Run `pnpm test`, `pnpm build`, `kaddo add agents`. Then verify `roadmap-agent.md` contains
the roadmap structure, instructs saving output to `architecture/roadmap.md`, and docs
explain the workflow.
