# Proposal: Flexible Roadmap Parsing & Work Item Materialization

## Problem

In the todoApp validation, `kaddo create --from roadmap` could not materialize Work Items
because the roadmap did not follow the exact VS-010 format. The real roadmap used a
human-friendly table (`| ID | Work Item | Depends on |`) which the parser did not recognize.
This breaks a core loop: roadmap → work item → development.

## Proposed Change

Make roadmap parsing **flexible**: a multi-strategy `parseRoadmapCandidates()` that
recognizes Work Item candidates across reasonable human/agent formats — candidate-style
(VS-010), tables, bullets, checklists and mixed initiative + table — as long as it can
identify a Work Item id, title, optional dependencies and initiative.

Model the **Roadmap Candidate → Materialized Work Item** distinction explicitly across
explain (candidates vs materialized vs remaining), understand (recommend materializing) and
context (expose both counts). This becomes the basis for VS-033 (Roadmap Synchronization).

## Out of Scope

Roadmap ↔ work-item synchronization, auto-updating the roadmap, scaffold, branch/commit
automation (future VS-033/035/032).

## Compatibility

VS-010 candidate-style roadmaps keep working unchanged (tried first).

## Success Criteria

`create --from roadmap` materializes Work Items from table/bullet/checklist/mixed roadmaps;
explain distinguishes candidates vs materialized vs remaining; understand recommends
materializing; context exposes both; tests cover all formats; docs/examples updated.
