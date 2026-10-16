---
inclusion: always
---

# Kaddo Setup and Capability Discovery

## Before using Kaddo

Confirm that:

- the open repository contains `.kaddo/config.yml` and `knowledge/`;
- Node.js and `npx` are available;
- the Kaddo MCP server is connected; and
- project status refers to the open repository, not the installed Power directory.

If project status cannot find Kaddo, stop and ask the user to configure `KADDO_PROJECT_DIR` or the
workspace MCP server. Do not continue against an ambiguous repository root.

## Discovering capabilities

Use the tools, resources and prompts exposed by the installed `@kaddo/mcp` version. Prefer its
discovery surface and canonical Kaddo documentation over a memorized inventory. Capabilities may
change between Kaddo releases.

Stable workflow anchors include project status, Work Item discovery and reading, readiness preview,
context generation, graph-assisted investigation, Guard-related reports and installed Skills. Use
specific names only after confirming that the installed server exposes them.

## Kaddo capability groups

The following surfaces are part of Kaddo. Discover their current API from the installed MCP server;
names and parameters below are guidance, not a frozen contract.

**Project Resources** — External systems the project uses (databases, cloud, APIs, queues, etc.)
declared under `knowledge/tech/resources/`. Read with `kaddo_list_resources` /
`kaddo_get_resource`. Create, update or delete via CLI (`kaddo resources create/update/delete`) or
the corresponding MCP write tools. Resources carry access interfaces, boundaries and auth
references — never credential values.

**Integrations** — External work-system connections declared in `.kaddo/integrations.yml`.
Adapters (Jira, GitHub Issues, etc.) expose external work items that can be previewed and imported
as Draft Work Items. Check status with `kaddo_integrations_status` or `kaddo integrations verify
<id>`. Import always requires a human-confirmed Kaddo type — Kaddo never infers it from the
external system.

**Initiatives** — An optional outcome/traceability layer over Work Items and roadmap candidates.
Initiatives track planning coverage (candidates materialized) and delivery progress (Work Items by
state). Read with `kaddo_list_initiatives` / `kaddo_get_initiative_progress`. Candidates can be
materialized into Draft Work Items via `kaddo_materialize_initiative_candidate`. A Work Item never
requires an initiative.

**Verification** — `kaddo verify <id>` (or `kaddo_verify_work_item`) collects implementation
evidence for an in-progress Work Item: changed paths, validation results and acceptance-criteria
status. Call after implementation, before proposing closure. Evidence is persisted in the Work Item
front matter under `implementation_evidence`.

**Work Item import** — `kaddo work-item import` (or `kaddo_work_item_import`) creates a Draft Work
Item from free-form external content (file, `--text`, stdin). Duplicate detection via content hash
prevents re-imports. Always results in a Draft requiring refinement.

**Telemetry** — `kaddo telemetry status/enable/disable` and `kaddo_telemetry_status` /
`kaddo_set_telemetry_consent`. Anonymous usage only; no project content, source code or PII is
transmitted.

## Reading strategy

1. Start with Kaddo's recommended next step and project status.
2. Read the context pack and relevant knowledge.
3. Select a Work Item with the human.
4. Inspect source only where the knowledge and confirmed task indicate verification is needed.

Repository exploration remains valid evidence gathering. It must be focused by known context rather
than used to reconstruct the whole project from scratch.

## Derived artifacts

When a Kaddo resource reports that a derived artifact is missing, use the matching capability from
the installed MCP server or ask the human to run the corresponding CLI command. Re-read the resource
after generation. Do not edit generated `.kaddo/` files manually.
