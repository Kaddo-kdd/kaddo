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
