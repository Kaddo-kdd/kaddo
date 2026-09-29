# Kaddo — Project Rules

## Project Language

- Knowledge artifacts, documentation, learnings: **Spanish**
- Code, filenames, keys, identifiers, commit messages: **English**

## Build Contract — Kaddo-Native Lifecycle

All changes follow the Kaddo Work Item lifecycle (Build Contract). No OpenSpec.

```
Captured Intent (draft) → Refinement → Human Review → Ready →
Implementation Handoff → Implementation → Evidence → Verification →
Human Review → Completed
```

### Work Item Directories

Work Items physically move between directories as they progress:

- `knowledge/delivery/work-items/draft/` — captured intent and refined drafts
- `knowledge/delivery/work-items/ready/` — human-approved, ready for implementation
- `knowledge/delivery/work-items/in-progress/` — actively being implemented
- `knowledge/delivery/work-items/completed/` — done, with learning section

### Lifecycle Tools

| Stage | CLI | MCP Tool |
|---|---|---|
| Create | `kaddo create` | `kaddo_work_item_import` |
| Refine | work-item-refinement skill | `kaddo_get_skill` |
| Ready | `kaddo ready <ID>` | `kaddo_mark_work_item_ready` |
| Handoff | implementation-planning skill | `kaddo_implementation_handoff` |
| Evidence | `kaddo verify <ID>` | `kaddo_collect_evidence` |
| Verify | `kaddo verify <ID>` | `kaddo_verify_work_item` |
| Complete | `kaddo learn <ID>` | — |

### Key Skills

- `work-item-refinement` — enrich draft WIs with ACs, scope confidence, validation
- `implementation-planning` — design deliberation + implementation plan
- `evidence-verification` — structured evidence collection and AC verification
- `learning-capture` — retrospective learning on completed WIs

### Key Agents

- `work-item-agent` — WI refinement and lifecycle
- `implementation-agent` — implementation handoff and execution
- `backlog-agent` — backlog management and prioritization
- `ownership-agent` — code ownership and responsibility
- `architecture-agent` — technical architecture decisions

## Versioning

- All 5 workspace packages share the same version: `cli`, `admin`, `admin-server`, `mcp`, `integrations`
- After completing a feature: bump all 5 package.json versions, commit, push, create+push tag

## Architecture

- pnpm workspace monorepo
- `.kaddo/` is gitignored — `config.yml`, `modules.yml` are local-only derived files
- MCP server is read-only except for lifecycle transitions and derived writes under `.kaddo/`
- `knowledge/` is the source of truth for project knowledge
- Build Contract reference: `knowledge/delivery/build-contract.md`

## OpenSpec

OpenSpec was used during early development. It has been removed from the working tree (VS-114).
Historical references in migration docs and completed WIs are legitimate and should not be removed.
Operational OpenSpec dependencies = 0. Do not create new OpenSpec artifacts.

## Contribution

See `CONTRIBUTING.md` for setup, testing, commit style, and release workflow.
