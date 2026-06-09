# Spec: Knowledge Capsules

## Capsule
- `type: knowledge-capsule` Markdown + JSON: purpose, responsibilities, capabilities, public
  contracts, dependencies, known risks, ADRs, owners, out of scope, usage notes; version +
  updated_at + source_project (+ optional source_commit).
- Deterministic export reads only `knowledge/` (no source, no secrets).

## Commands
- `kaddo capsule export` → `.kaddo/exports/<name>.capsule.md|json`.
- `kaddo capsule add <path>` → copy to `external/<id>.capsule.md` + register in `.kaddo/external.yml`.

## Surfaces
- context: `## External Knowledge`. explain: list + staleness (>90d) warning. understand: reminder.
- capsule-agent refines/validates; never exports secrets/source/invented contracts.

## Out of scope
- Remote scanning, GitHub API, auto-sync, permissions, portal, MCP, RAG, vector DB.

## Acceptance criteria
- AC1 documented concept. AC2 export command. AC3 add/import command. AC4 `.kaddo/external.yml`.
- AC5 context External Knowledge. AC6 explain lists capsules. AC7 understand mentions external.
- AC8 capsule-agent. AC9 capsule has purpose/capabilities/contracts/dependencies/risks/owners.
- AC10 docs differentiate multirepo vs capsules. AC11 no source/secrets exported. AC12 EN/ES.
- AC13 tests cover export/add/context/explain.
