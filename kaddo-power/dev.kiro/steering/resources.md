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

## Capability groups

The installed `@kaddo/mcp` server exposes these groups. Confirm with the server before using:

- **Project Resources** — `kaddo_list_resources`, `kaddo_get_resource`, `kaddo_create_resource`,
  `kaddo_update_resource`, `kaddo_delete_resource`. External systems declared under
  `knowledge/tech/resources/`. Auth references only — never credential values.

- **Integrations** — `kaddo_integrations_list`, `kaddo_integrations_status`,
  `kaddo_integrations_work_items`, `kaddo_integrations_work_item`. Read external work systems.
  Import is a separate human-confirmed action (`kaddo_work_item_import`).

- **Initiatives** — `kaddo_list_initiatives`, `kaddo_get_initiative`,
  `kaddo_get_initiative_context`, `kaddo_get_initiative_progress`, `kaddo_create_initiative`,
  `kaddo_update_initiative`, `kaddo_add_initiative_candidate`,
  `kaddo_materialize_initiative_candidate`, `kaddo_analyze_initiative`,
  `kaddo_complete_initiative`. Optional outcome/traceability layer over Work Items.

- **Verification** — `kaddo_verify_work_item`, `kaddo_collect_evidence`,
  `kaddo_implementation_handoff`. Collect and persist implementation evidence against acceptance
  criteria for an in-progress Work Item.

- **Telemetry** — `kaddo_telemetry_status`, `kaddo_set_telemetry_consent`. Consent management
  only; no project content is transmitted.

## Missing information

- If a derived resource is missing, use the matching installed generation capability and re-read it.
- If authored knowledge is missing, surface the gap to the human; do not invent it.
- If graph results suggest impact, present them as candidates to investigate.
- If a capability is not exposed by the installed MCP server, do not fabricate its name or schema.

The canonical server reference lives in `packages/mcp/README.md` in the Kaddo repository.
