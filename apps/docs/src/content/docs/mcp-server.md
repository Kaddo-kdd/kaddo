---
title: MCP Server
description: Expose your Kaddo project knowledge to MCP-compatible agents and IDEs through a read-only Model Context Protocol server.
---

`@kaddo/mcp` is a **read-only** [Model Context Protocol](https://modelcontextprotocol.io) server
that exposes your project's curated Kaddo knowledge to any MCP-compatible client (IDE or agent).
Instead of running `kaddo context`, copying the context pack and pasting an agent prompt by hand,
the agent queries Kaddo directly for context, status, Work Items, graph, hints and prompts.

```text
MCP Client / IDE / Agent
        ↓
    @kaddo/mcp
        ↓
.kaddo/ + knowledge/ + external/
        ↓
context · explain · understand · graph · work items · capsules · prompts
```

> **Read-only by design.** The server never modifies knowledge, edits files, runs git, calls an
> LLM or scans your source code. It is a separate, lightweight package — the CLI stays lean.

## Install & run

No install needed:

```bash
npx @kaddo/mcp
```

The server speaks MCP over **stdio** and operates on the project in its working directory (or the
directory in the `KADDO_PROJECT_DIR` environment variable). It shares its version with
[`@kaddo/cli`](/commands/overview/).

## Configure an MCP client

```json
{
  "mcpServers": {
    "kaddo": {
      "command": "npx",
      "args": ["@kaddo/mcp"],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

`cwd` must point to the project that contains `.kaddo/`, `knowledge/` and (optionally) `external/`.
A ready-to-copy example lives in [`examples/mcp/`](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/mcp).

## Resources

| URI | Reads | Purpose |
|---|---|---|
| `kaddo://context-pack` | `.kaddo/context-pack.md` | curated LLM context |
| `kaddo://explain` | `.kaddo/explain.md` | what Kaddo knows |
| `kaddo://understand` | `.kaddo/understand.md` | current phase + next step |
| `kaddo://graph` | `.kaddo/graph.json` + `.mmd` | knowledge graph |
| `kaddo://graph-hints` | `.kaddo/graph-hints.md` + `.json` | weak/missing relationships |
| `kaddo://work-items` | `knowledge/delivery/work-items/` | summarized Work Items |
| `kaddo://roadmap` | `knowledge/delivery/roadmap.md` | delivery roadmap |
| `kaddo://capsules` | `.kaddo/external.yml` + `external/` | external Knowledge Capsules |
| `kaddo://agents` | `knowledge/agents/` | installed agent prompts |
| `kaddo://skills` | `knowledge/skills/` | installed [skills](/skills/) (empty if none) |
| `kaddo://skills/<id>` | `knowledge/skills/<id>/skill.md` | one reusable skill |
| `kaddo://impact-report` | `.kaddo/reports/` (or in memory) | [Knowledge Impact Report](/impact-report/) |

## Tools (read-only)

- `kaddo_project_status` — compact status (state, work items, ownership, graph quality, capsules).
- `kaddo_list_work_items` — filter by `status` / `type` / `knowledge_level`.
- `kaddo_get_work_item` — a Work Item by `id` (summary + full markdown).
- `kaddo_list_capsules` / `kaddo_get_capsule` — external Knowledge Capsules.
- `kaddo_list_agents` / `kaddo_get_agent_prompt` — installed agent prompts.
- `kaddo_list_skills` / `kaddo_get_skill` — installed reusable [skills](/skills/).
- `kaddo_list_graph_hints` — graph hints, filter by `artifact_type` / `severity` / `active_only`.

## Derived tools (write only under `.kaddo/`)

When a derived artifact is missing or stale, these tools regenerate it in place — using the same
core logic as the CLI — so the agent never has to drop to a terminal. They are deterministic (no
LLM, no git) and **write only under `.kaddo/`**; they never modify `knowledge/`, `src/`,
`external/` or `.kaddo/external.yml`.

| Tool | Writes | CLI equivalent |
|---|---|---|
| `kaddo_generate_context` | `.kaddo/context-pack.md` + `.json` | `kaddo context` |
| `kaddo_generate_explain` | `.kaddo/explain.md` + `.json` | `kaddo explain` |
| `kaddo_generate_understand` | `.kaddo/understand.md` | `kaddo understand` |
| `kaddo_generate_graph` | `.kaddo/graph.json` + `.mmd` + `graph-hints.md` + `.json` | `kaddo graph export` |
| `kaddo_generate_capsule_draft` | `.kaddo/exports/<project>.capsule.md` + `.json` | `kaddo capsule export` |
| `kaddo_generate_impact_report` | `.kaddo/reports/impact-report.md` / `.json` | `kaddo report impact` |

Each returns `{ status, files_written, summary, warnings, next_suggested_resources }`. Every write
passes through a central allowlist (`assertMcpDerivedWritePath`); any path outside the derived
`.kaddo/` set is rejected with `Blocked unsafe MCP derived write path.`

`kaddo_generate_capsule_draft` writes a **draft only** under `.kaddo/exports/` — it never registers
or imports a capsule (use the CLI `kaddo capsule add` for that).

### Typical flow

```text
agent queries MCP → derived resource missing or stale
        ↓
derived tool regenerates it under .kaddo/
        ↓
agent reads the refreshed resource and continues
```

For example: *"refresh the context pack and summarize the current phase"* →
`kaddo_generate_context` → `kaddo://context-pack` → `kaddo_project_status`. Or: *"regenerate the
graph and review hints"* → `kaddo_generate_graph` → `kaddo://graph-hints` → the `graph-agent`
prompt.

Whether a tool runs automatically or needs confirmation is decided by your MCP client — the prompts
may suggest a derived tool when a resource is missing, but never force it.

## Prompts

Every installed agent prompt (`knowledge/agents/**`) is exposed as an MCP prompt — `business-agent`,
`work-item-agent`, `implementation-agent`, `graph-agent`, `capsule-agent`, and so on — with its full
content and recommended inputs. Install them with [`kaddo add agents`](/modules/agents/).

## Resources never auto-generate

**Resources** are pure reads — they never generate files. If a derived file is missing, the resource
returns a clear instruction (and you can then call the matching [derived tool](#derived-tools-write-only-under-kaddo)):

| Missing | Response |
|---|---|
| `.kaddo/config.yml` | `Kaddo project not found. Run kaddo init first.` |
| `.kaddo/context-pack.md` | `Context pack not found. Run kaddo context in the project first.` |
| `.kaddo/graph.json` | `Knowledge graph not found. Run kaddo graph export first.` |
| `knowledge/` | `Knowledge repository not found. Run kaddo bootstrap first.` |

## Security

The server only reads `.kaddo/`, `knowledge/` and `external/`. It never reads `src/`, `.git/`,
`node_modules/`, `dist/`, `build/` or `coverage/`, blocks path traversal, and never exposes secrets,
tokens, env values, source code or PII.

## What it does NOT do

No writes outside `.kaddo/`, no knowledge/source edits, no Work Item creation, no `kaddo scan`/
`learn`/`owners suggest`/`capsule add`, no `kaddo add`, no git, no remote sync, no GitHub API, no
HTTP server, no auth, no RAG, no vector database, no LLM calls. The derived tools regenerate
artifacts **only under `.kaddo/`**; everything else is read-only.

## See also

- [Commands Overview](/commands/overview/) — the CLI that produces what MCP reads.
- [Knowledge Graph Export](/knowledge-graph-export/) and [Knowledge Capsules](/knowledge-capsules/).
- [Agent Prompt Packs](/modules/agents/) — exposed as MCP prompts.
