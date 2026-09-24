---
inclusion: auto
name: kaddo-resources
description: Use when choosing between Kaddo MCP resources, tools and Skills without relying on a static API inventory.
---

# Kaddo MCP Usage Guide

The installed `@kaddo/mcp` version is the source of truth for available resources, tools, prompts,
parameters and schemas. Discover its current capabilities instead of relying on a copied catalog.

## Choose the right surface

| Need | Prefer |
| --- | --- |
| Read project knowledge or a generated view | MCP resource |
| Filter, compute, validate or perform a guarded lifecycle action | MCP tool |
| Apply reusable KDD methodology | Canonical Kaddo Skill |
| Persist repository-specific agent instructions | Kiro adapter-generated `AGENTS.md` |

Start from the recommended next step, project status and context pack. Then read only the Work Item,
knowledge layers, module context, graph evidence or reports relevant to the confirmed task.

## Missing information

- If a derived resource is missing, use the matching installed generation capability and re-read it.
- If authored knowledge is missing, surface the gap to the human; do not invent it.
- If graph results suggest impact, present them as candidates to investigate.
- If a capability is not exposed by the installed MCP server, do not fabricate its name or schema.

The canonical server reference lives in `packages/mcp/README.md` in the Kaddo repository.
