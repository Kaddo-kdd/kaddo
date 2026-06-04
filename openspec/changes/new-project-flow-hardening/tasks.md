# Tasks: New Project Flow Hardening & Agent Organization

## Phase 1 — Agents: folders, recommended-new, understand

- [ ] `groups.ts`: `agentGroupOf` + `agentInstallPath` (per-layer folder).
- [ ] Agents module writes to `knowledge/agents/<group>/<agent>.md`.
- [ ] Add capability/architecture/adr to the recommended `new` set.
- [ ] Resolve installed agents via group path (understand + explain `hasAgents`,
      with flat-folder fallback).
- [ ] `understand`: clearer per-phase next steps.
- [ ] Tests.

## Phase 2 — Explain parser + current-state recovery

- [ ] Work Items = under `knowledge/delivery/work-items/` with a valid work-item type;
      exclude ADRs and untyped artifacts.
- [ ] Reintroduce `current-state.md` as optional/recommended (knowledge status).
- [ ] Tests for the parser and current-state.

## Phase 3 — Docs & examples (EN/ES)

- [ ] Manifesto: progressive discovery + intent vs reality.
- [ ] Workflow: artifact-purpose table + command responsibilities.
- [ ] Visual Guide: ownership flow `scan → owners suggest → agent → human`.
- [ ] Ownership docs: multiple `code:` globs.
- [ ] Examples: current-state, agent folders, ownership flow.

## Validation

- [ ] `pnpm --filter "@kaddo/cli" test`
- [ ] `pnpm -r build`
