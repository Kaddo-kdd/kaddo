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

> **Mostly read-only.** The server never runs git, calls an LLM or scans your source code.
> Lifecycle tools (import, ready, evidence, verify) can write under `knowledge/delivery/work-items/`
> and derived tools write under `.kaddo/`. Everything else is strictly read-only.

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
| `kaddo://savings-report` | `.kaddo/reports/` (or in memory) | [Estimated Savings Report](/savings-report/) |
| `kaddo://drift-report` | `.kaddo/reports/` (or in memory) | [Drift Trend Report](/drift-report/) |
| `kaddo://guard-history` | `.kaddo/history/guard-runs.jsonl` | recorded guard runs |
| `kaddo://build-contract` | `knowledge/delivery/build-contract.md` | Kaddo-native Build Contract lifecycle |
| `kaddo://open-questions` | business/product/codebase/roadmap | classified open questions |
| `kaddo://roadmap-readiness` | (computed) | roadmap readiness summary |
| `kaddo://tech-decisions` | (computed) | decision candidates vs ADRs + suggested ADR filenames |
| `kaddo://installed-assets` | (computed) | agent/skill version status vs current package |
| `kaddo://roadmap-quality` | (computed) | initiative and WI-candidate grounding quality |
| `kaddo://work-item-candidates` | `knowledge/delivery/roadmap.md` | materializable WI candidates from roadmap |
| `kaddo://next-step` | (computed) | state-aware next-step recommendation |
| `kaddo://project-route` | (computed) | project lifecycle progress map |
| `kaddo://scan-signals` | `.kaddo/scan.json` | actionable signals from `kaddo scan` |

## Tools (read-only)

- `kaddo_project_status` — compact status (state, work items, ownership, graph quality, capsules).
- `kaddo_list_work_items` — filter by `status` / `type` / `knowledge_level`.
- `kaddo_get_work_item` — a Work Item by `id` (summary + full markdown).
- `kaddo_list_capsules` / `kaddo_get_capsule` — external Knowledge Capsules.
- `kaddo_list_agents` / `kaddo_get_agent_prompt` — installed agent prompts.
- `kaddo_list_skills` / `kaddo_get_skill` — installed reusable [skills](/skills/).
- `kaddo_list_graph_hints` — graph hints, filter by `artifact_type` / `severity` / `active_only`.

## Work Item Lifecycle tools

These tools cover the full Build Contract lifecycle. They can write under
`knowledge/delivery/work-items/` for lifecycle transitions.

| Tool | Stage | Purpose |
|---|---|---|
| `kaddo_work_item_import` | Captured Intent | Import a Work Item from text/Markdown as a draft. Parses, normalizes, and generates a refinement handoff. |
| `kaddo_mark_work_item_ready` | Ready | Assess readiness and transition a draft WI to ready (moves file from `draft/` to `ready/`). |
| `kaddo_implementation_handoff` | Handoff | Build an agent-agnostic Implementation Handoff for a ready WI with context guidance and design deliberation prompts. |
| `kaddo_collect_evidence` | Evidence | Collect structured implementation evidence: changed paths, validations, AC verifications. |
| `kaddo_verify_work_item` | Verification | Verify evidence against ACs, release gates, and completion exceptions. Returns a completion decision. |

## Multirepo tools

Tools for agents working with multirepo `core`/`module` projects. All are read-only except
`kaddo_export_capsule` which writes derived capsule files under `.kaddo/exports/`.

| Tool | Purpose |
|---|---|
| `kaddo_modules_list` | List mapped modules and their Kaddo configuration status (core only). |
| `kaddo_get_module_context` | Get a module's `module-context.md`, tech summaries and warnings. |
| `kaddo_validate_work_item_modules` | Validate `affected_modules` coherence and cross-repo ownership. |
| `kaddo_get_work_item_context` | Composite context for implementing a multirepo Work Item. |
| `kaddo_suggest_branch_strategy` | Suggest branch names, commit messages and checklist. Does NOT execute git. |
| `kaddo_export_capsule` | Export a capsule (project, system, or module scope) under `.kaddo/exports/`. |
| `kaddo_modules_discover` | Discover sibling repos configured as Kaddo modules. Does not persist without apply+confirm. Core only. |

**Security:** none of these tools executes git, deploys, installs dependencies or calls an LLM.
`kaddo_suggest_branch_strategy` only *suggests* branch names and commit messages — the agent
or user must create branches and commit manually.

## System Graph tools

Read-only traversal over the semantic [system topology](/commands/admin/). They help an agent
**widen what it must investigate** before deciding a Work Item's scope. Everything they surface is
an **impact candidate** to verify in the repository — never confirmed scope. A missing Graph edge
does not mean "no impact": traversal is bounded and coverage may be partial.

| Tool | Purpose |
|---|---|
| `kaddo_system_search` | Search entities by label / kind / module / purpose (concepts before implementation). |
| `kaddo_system_node` | One entity plus its incoming and outgoing relationships. |
| `kaddo_system_neighbors` | Bounded BFS neighborhood (`maxDepth` / `maxNodes`, optional `relationshipTypes` / `moduleId`). Reports truncation. |
| `kaddo_system_paths` | Directed, acyclic, bounded paths between two entities. |
| `kaddo_system_impact_candidates` | Graph-assisted impact **candidates** from one or more seed entities, with reasons and graph paths. |

**Security:** these tools never decide scope, mutate the Work Item, run an LLM or touch git. The
agent inspects each candidate and classifies it as *affected*, *reviewed-not-affected* or *unknown*,
preserving the reason; a human confirms before the classification is written to the Work Item.

## Integration tools

Read-only access to the [Integration Adapter Foundation](/integrations/) — external work systems such
as GitHub Issues, Jira or Azure DevOps. Reading an external item never creates a Kaddo Work Item;
**import is a separate, human-confirmed action** and is intentionally not exposed over MCP. Secrets
are never returned (only the names of the environment variables a credential references).

| Tool | Purpose |
|---|---|
| `kaddo_integrations_list` | List configured integrations and their capabilities. |
| `kaddo_integrations_status` | Verify integrations and report connection status (available / unauthorized / …). |
| `kaddo_integrations_work_items` | List external work items from an integration (paginated). |
| `kaddo_integrations_work_item` | Read a single external work item. |

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
| `kaddo_generate_savings_report` | `.kaddo/reports/savings-report.md` / `.json` | `kaddo savings` |
| `kaddo_generate_drift_report` | `.kaddo/reports/drift-report.md` / `.json` | `kaddo drift` |
| `kaddo_generate_questions_report` | `.kaddo/reports/questions-report.md` / `.json` | `kaddo questions` |

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

No source code edits, no `kaddo scan`/`learn`/`owners suggest`/`capsule add`, no `kaddo add`, no git,
no remote sync, no GitHub API, no HTTP server, no auth, no RAG, no vector database, no LLM calls.
Lifecycle tools write only under `knowledge/delivery/work-items/` for transitions; derived tools
write only under `.kaddo/`. Everything else is read-only.

## See also

- [Commands Overview](/commands/overview/) — the CLI that produces what MCP reads.
- [Knowledge Graph Export](/knowledge-graph-export/) and [Knowledge Capsules](/knowledge-capsules/).
- [Agent Prompt Packs](/modules/agents/) — exposed as MCP prompts.
