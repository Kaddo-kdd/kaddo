# Proposal: Knowledge Capsules for External Repositories (VS-054)

## Why

Large systems depend on many repos (orders, payments, identity…) owned by other teams,
access-restricted or out of scope. Mapping them all as multirepo adds noise and isn't always
viable. A consumer rarely needs their source — only enough knowledge to integrate well.

## What

Introduce **Knowledge Capsules**: a minimal, portable, versionable summary a project exports about
itself, that other projects import as external context.

- `kaddo capsule export` → deterministic draft at `.kaddo/exports/<name>.capsule.md` / `.json`
  (purpose, capabilities, public contracts, dependencies, risks, ADRs, owners, out-of-scope). The
  CLI never reads source or secrets; the capsule-agent refines it.
- `kaddo capsule add <path>` → copies into `external/<id>.capsule.md` and registers it in
  `.kaddo/external.yml`.
- `kaddo context` adds an `## External Knowledge` section; `kaddo explain` lists capsules and warns
  on stale ones; `kaddo understand` reminds you to review the relevant capsule.
- new `capsule-agent` (refine/validate; never export secrets/source/invented contracts).
- docs: a Knowledge Capsules page + multirepo-vs-capsules distinction (EN/ES).

## Impact

Kaddo scales to large orgs where relevant knowledge lives outside the current repo. Out of scope:
remote scanning, GitHub API, auto-sync, permissions, portal, MCP, RAG, vector DB.
