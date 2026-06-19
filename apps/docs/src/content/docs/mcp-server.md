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
| `kaddo://skills` | `knowledge/skills/` | installed skills (empty if none) |

## Tools (read-only)

- `kaddo_project_status` — compact status (state, work items, ownership, graph quality, capsules).
- `kaddo_list_work_items` — filter by `status` / `type` / `knowledge_level`.
- `kaddo_get_work_item` — a Work Item by `id` (summary + full markdown).
- `kaddo_list_capsules` / `kaddo_get_capsule` — external Knowledge Capsules.
- `kaddo_list_agents` / `kaddo_get_agent_prompt` — installed agent prompts.
- `kaddo_list_graph_hints` — graph hints, filter by `artifact_type` / `severity` / `active_only`.

## Prompts

Every installed agent prompt (`knowledge/agents/**`) is exposed as an MCP prompt — `business-agent`,
`work-item-agent`, `implementation-agent`, `graph-agent`, `capsule-agent`, and so on — with its full
content and recommended inputs. Install them with [`kaddo add agents`](/modules/agents/).

## No automatic generation

The server never generates files. If a derived file is missing it returns a clear instruction:

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

No writes, no Work Item creation, no `kaddo scan`/`context`/`graph export`/`learn`/`owners suggest`,
no git, no remote sync, no GitHub API, no HTTP server, no auth, no RAG, no vector database. The
heavy KDD logic stays in the CLI; the MCP server only reads what the CLI produced.

## See also

- [Commands Overview](/commands/overview/) — the CLI that produces what MCP reads.
- [Knowledge Graph Export](/knowledge-graph-export/) and [Knowledge Capsules](/knowledge-capsules/).
- [Agent Prompt Packs](/modules/agents/) — exposed as MCP prompts.
