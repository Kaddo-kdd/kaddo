# Spec: Work Item Type Expansion — chore

## Type catalog
- Official types: `feature`, `bugfix`, `hotfix`, `spike`, `chore`.
- `chore` = technical/maintenance/tooling/config/infra work; no functional capability.
- Aliases → chore: setup, maintenance, tooling, infrastructure, infra, refactor, config.
- `chore` maps to Knowledge Level K1.

## Behavior
- `kaddo create` and `--from roadmap` accept `chore`/aliases without prompting.
- roadmap-agent/work-item-agent use and preserve `chore`.
- explain → Work Items by Type; context → Delivery Mix (active, by type).

## Out of scope
- New Work Item states, prioritization, epics, releases, story points, estimation.

## Validation
- Tests cover chore parsing, alias resolution, materialization, explain + context by type.
- Full suite + build green.

## Acceptance criteria
- **AC1** `chore` is an official type.
- **AC2** `kaddo create --from roadmap` accepts `chore`.
- **AC3** Official agents use `chore` when appropriate.
- **AC4** Aliases (setup/maintenance/tooling/infrastructure) resolve correctly.
- **AC5** Explain recognizes `chore` Work Items.
- **AC6** Context Pack includes distribution by type.
- **AC7** Documentation updated (EN/ES).
- **AC8** Examples updated.
- **AC9** Tests cover parsing and materialization of `chore`.
