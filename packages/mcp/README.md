# @kaddo/mcp

A **read-only** [Model Context Protocol](https://modelcontextprotocol.io) server for
[Kaddo](https://kaddo.trycatch.tv). It exposes your project's curated Kaddo knowledge —
context pack, explain, understand, knowledge graph, graph hints, Work Items, roadmap, Knowledge
Capsules and installed agent prompts — to any MCP-compatible client (IDE or agent), so the agent
gets structured context instead of scanning your whole repository.

> Read-only by design. The server never modifies knowledge, edits files, runs git, calls an LLM
> or scans your source code.

## Install & run

No install needed — run it with `npx`:

```bash
npx @kaddo/mcp
```

The server speaks MCP over **stdio** and operates on the project in its working directory (or the
directory set via the `KADDO_PROJECT_DIR` environment variable).

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
| `kaddo://skills` | `knowledge/skills/` | installed reusable skills (empty if none) |
| `kaddo://skills/<id>` | `knowledge/skills/<id>/skill.md` | one reusable skill |

## Tools (read-only)

- `kaddo_project_status` — compact project status (state, work items, ownership, graph quality, capsules).
- `kaddo_list_work_items` — filter by `status` / `type` / `knowledge_level`.
- `kaddo_get_work_item` — a Work Item by `id` (summary + full markdown).
- `kaddo_list_capsules` / `kaddo_get_capsule` — external Knowledge Capsules.
- `kaddo_list_agents` / `kaddo_get_agent_prompt` — installed agent prompts.
- `kaddo_list_skills` / `kaddo_get_skill` — installed reusable skills.
- `kaddo_list_graph_hints` — graph hints, filter by `artifact_type` / `severity` / `active_only`.

## Derived tools (write only under `.kaddo/`)

When a derived artifact is missing or stale, these tools regenerate it in place using the same core
logic as the CLI — so the agent never has to leave the flow. They are deterministic (no LLM) and
**only write under `.kaddo/`**; they never touch `knowledge/`, `src/`, `external/`,
`.kaddo/external.yml` or git.

| Tool | Writes | CLI equivalent |
|---|---|---|
| `kaddo_generate_context` | `.kaddo/context-pack.md` + `.json` | `kaddo context` |
| `kaddo_generate_explain` | `.kaddo/explain.md` + `.json` | `kaddo explain` |
| `kaddo_generate_understand` | `.kaddo/understand.md` | `kaddo understand` |
| `kaddo_generate_graph` | `.kaddo/graph.json` + `.mmd` + `graph-hints.md` + `.json` | `kaddo graph export` |
| `kaddo_generate_capsule_draft` | `.kaddo/exports/<project>.capsule.md` + `.json` | `kaddo capsule export` |

`kaddo_generate_capsule_draft` writes a **draft only** — it never registers/imports a capsule
(`external/`, `.kaddo/external.yml` stay untouched; use the CLI `kaddo capsule add` for that).

Each tool returns `{ status, files_written, summary, warnings, next_suggested_resources }`. All
writes pass through a central allowlist (`assertMcpDerivedWritePath`) that blocks any path outside
the derived `.kaddo/` set — attempts return `Blocked unsafe MCP derived write path.`

**When to use:** after a resource reports a missing file (e.g. `Run kaddo context first`), call the
matching derived tool, then read the resource again. Whether a tool runs automatically or needs
confirmation is up to your MCP client.

## Prompts

Every installed agent prompt (`knowledge/agents/**`) is exposed as an MCP prompt
(`business-agent`, `work-item-agent`, `implementation-agent`, `graph-agent`, …) with its full
content and recommended inputs.

## What it does NOT do

No writes outside `.kaddo/`, no knowledge/source edits, no Work Item creation, no `kaddo scan`/
`learn`/`owners suggest`/`capsule add`, no `kaddo add`, no git, no remote sync, no GitHub API, no
HTTP server, no auth, no RAG, no vector database, no LLM calls. The derived tools above may
regenerate artifacts **only under `.kaddo/`**; everything else is read-only.

## Security

The server only reads `.kaddo/`, `knowledge/` and `external/`. It never reads `src/`, `.git/`,
`node_modules/`, `dist/`, `build/` or `coverage/`, blocks path traversal, and never exposes
secrets, tokens, env values, source code or PII.

## Troubleshooting

- **"Kaddo project not found. Run `kaddo init` first."** — `cwd` is not a Kaddo project. Point it
  at the directory containing `.kaddo/config.yml`.
- **"… not found. Run `kaddo …` first."** — the derived file hasn't been generated yet. Run the
  named CLI command (e.g. `kaddo context`, `kaddo graph export`).
- **No prompts listed** — install agents with `kaddo add agents`.

Same version as `@kaddo/cli`. See the [MCP Server docs](https://kaddo.trycatch.tv/mcp-server/).
