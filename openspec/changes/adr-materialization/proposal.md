# Proposal: ADR Materialization from Decision Candidates (VS-075)

## Why

The architecture-agent produces `knowledge/tech/decision-candidates.md`, but decisions stayed as
notes — `knowledge/tech/decisions/` remained empty. There was no strong transition from candidate →
ADR, so decisions weren't versioned, traceable to Work Items, or given rationale/consequences. This
matters most for pre-ai/legacy projects where decisions already exist but aren't documented.

## What

Detect technical decision candidates and materialized ADRs, surface a readiness signal, and provide a
read-only handoff (Option A) that lists the ADRs to create:

- `core/decisions.ts`: `buildTechDecisions(dir)` → `tech_decisions` status
  (`none`/`candidates`/`draft-adrs`/`accepted-adrs`), candidate titles (parsed from `##` headings),
  ADR counts (draft/accepted from front-matter status), and suggested ADR filenames continuing the
  numbering.
- `kaddo adr` (alias `kaddo decisions`): lists candidates, their source and the suggested ADR files;
  `--json`. Read-only — never writes ADRs, never marks `accepted`, no LLM, no git.
- `kaddo explain` shows a `## Tech Decisions` section (+ adr-writing recommendation); `kaddo context`
  carries `techDecisions` and adds a Missing Context note; `kaddo understand` recommends the
  adr-writing skill when candidates exist without ADRs.
- Roadmap is **not** blocked; the work-item-agent and implementation-agent **warn** before
  implementing work affected by an unformalized decision, and recommend `related_decisions` /
  `decision_candidates` metadata.
- `adr-writing` skill formalized: statuses (draft/accepted/superseded/deprecated); sections Context /
  Options Considered / Decision / Consequences / Related Capabilities / Related Work Items;
  materialize-from-candidates guidance (copy context+options, leave decision/consequences `[open]`,
  `created_from:`). No accepted ADRs auto-created.

## Scope

Detection + recommendation + handoff (Option A). No deterministic ADR file creation (`kaddo adr
create --from candidates` is left for a later VS). Keeps the current `knowledge/tech/` structure.

## Impact

- New `core/decisions.ts`, `commands/adr.ts`; `project-explain.ts`, `context-pack.ts`, `understand.ts`
  surface tech decisions; `agents/prompts.ts` (work-item/implementation) + `skills/skills.ts`
  (adr-writing); `index.ts` + command-help register `adr`. New docs Tech Decisions page (EN/ES) +
  sidebar; README. Minor bump 3.40.0.
