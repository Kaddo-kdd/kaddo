# Spec: Agent Trace & Responsibility Boundaries

## Agent Trace
- Every official prompt ends with `## Responsibility & Boundaries` + `## Agent Trace`.
- Trace block declares `Agent`, `Produced`, `Next`.

## Responsibility matrix
- Official matrix per agent: responsibleFor / produces / canSuggest / cannotSuggest / next.
- Agents produce knowledge only; never run Git, code or commands.

## Git responsibility model
- Only `implementation-agent` may suggest a branch (respecting `knowledge/tech/git-strategy.md`).
- `roadmap-agent`, `work-item-agent`, `business-agent`, `product-agent` must not suggest
  branches/commits/PRs.

## Handoff rules
- roadmap-agent → `kaddo create --from roadmap` → work-item-agent → implementation-agent.
- implementation-agent → scan → owners suggest → guard → explain.

## Out of scope
- Agent auto-execution, multi-agent orchestration, automatic branch/commit, GitHub integration, MCP.

## Validation
- Tests assert AC1–AC6 invariants; full suite + build green.

## Acceptance criteria
- **AC1** All official agents include Agent Trace.
- **AC2** Official responsibility matrix exists.
- **AC3** roadmap-agent does not suggest branches.
- **AC4** work-item-agent does not suggest commits.
- **AC5** implementation-agent is the only agent allowed to suggest branches.
- **AC6** Git strategy is respected when it exists.
- **AC7** understand uses the defined handoffs.
- **AC8** Visual Guide updated.
- **AC9** Examples updated.
- **AC10** Documentation EN/ES updated.
