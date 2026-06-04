# Proposal: New Project Flow Hardening & Agent Organization

## Problem

A full validation with a real new project (todoApp) confirmed the conceptual model
(Idea → Business → Product → Tech → Delivery) works, but surfaced frictions:

1. **Agents for `new`**: `capability-agent` and `architecture-agent` were needed during the
   real flow but are not in the recommended set for `new`.
2. **Command confusion**: when to use `scan` / `context` / `understand` / `explain`, and
   what each updates, is unclear.
3. **Ownership**: the `scan → owners suggest → agent → human` flow exists but is
   under-explained (incl. multiple `code:` globs).
4. **Parsers**: `explain` lists ADRs as Work Items and counts items with no valid type.
5. **Intent vs reality**: `codebase.md` (intent) and `current-state.md` (reality) must stay
   distinct; `current-state.md` was effectively lost and should return as recommended.

## Proposed Change

- **Agent folders**: install agents under `knowledge/agents/<group>/` (business/product/
  tech/delivery/utilities).
- **Recommended `new` set**: add `capability-agent`, `architecture-agent` (and `adr-agent`).
- **Explain parser**: Work Items are only artifacts under `knowledge/delivery/work-items/`
  with a valid work-item type; ADRs and untyped artifacts are never Work Items.
- **Current State recovery**: reintroduce `knowledge/tech/current-state.md` as an optional
  but recommended artifact (reality), distinct from `codebase.md` (intent).
- **Command clarity + ownership docs**: document scan/context/understand/explain and the
  ownership flow (multi-glob `code:`).
- **Understand**: clearer next steps per phase.
- **Intent vs reality** reflected in manifesto, workflow, visual guide, explain, examples.

## Out of Scope

Scaffold generation, roadmap synchronization, advanced domain mapping, branch/commit
automation, MCP (future VS-032..034).

## Success Criteria

Agents install in per-layer folders; `new` recommends capability + architecture agents;
explain never shows ADRs/invalid items as Work Items; current-state is documented as the
reality artifact distinct from codebase intent; docs/examples reflect the corrected flow;
tests + build pass.
