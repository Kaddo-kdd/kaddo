# Proposal: Knowledge Discovery & Semantic Recognition

## Problem

The todoApp validation showed Kaddo conflated "knowledge that exists" with "knowledge Kaddo
recognizes": explain/understand were too tied to **path and file name**. Consolidated
artifacts went unrecognized — `business.md` existed but explain reported "Business missing";
`product.md` documented capabilities but they were not detected; a roadmap with WI
candidates showed "Work Items: 0"; decisions were only found as explicit ADR files.

## Proposed Change

Recognize knowledge by **meaning and metadata (front-matter `type`)**, not primarily by
path/name. Add a Knowledge Discovery Engine (`core/knowledge-discovery.ts`) with the
priority: front-matter type → Kaddo conventions → path → name. Report per-layer **maturity**
(Missing / Consolidated / Structured / Partial / Traceable). Wire it into `kaddo explain`,
`kaddo understand` and `kaddo context`. Recommend materializing roadmap candidates into
Work Items when applicable.

## Out of Scope

Roadmap synchronization, scaffold generation, domain mapping, MCP, portal.

## Success Criteria

Consolidated business/product are recognized; capabilities/current-state/ADRs are detected
by front-matter type regardless of filename; Work Items are recognized by type; explain no
longer depends on exact names; understand recommends materializing Work Items; context
includes knowledge maturity; tests + build pass.
