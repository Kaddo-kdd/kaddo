# Design: New Project Flow Hardening & Agent Organization

## Agent folders (per layer)

Agents install under `knowledge/agents/<group>/<agent>.md`:

```
knowledge/agents/
  README.md
  business/   business-agent.md
  product/    bootstrap-agent.md · capability-agent.md
  tech/       architecture-agent.md · codebase-agent.md · stack-agent.md ·
              security-agent.md · standards-agent.md · module-design-agent.md · adr-agent.md
  delivery/   roadmap-agent.md · work-item-agent.md · git-strategy-agent.md
  utilities/  legacy-agent.md
```

`groups.ts` gains `agentGroupOf(fileName)` and `agentInstallPath(fileName)` =
`knowledge/agents/<group>/<fileName>`. The agents module builds files at those paths.
`understand` (installed check) and `explain` (`hasAgents`) resolve agents recursively /
via the group path instead of assuming a flat folder.

## Recommended agents for `new`

```
business-agent · bootstrap-agent · capability-agent · architecture-agent ·
codebase-agent · roadmap-agent · work-item-agent · adr-agent
```

(capability + architecture are needed during the Business → Product → Tech transition.)

## Explain parser fix

Work Items = artifacts whose path is under `knowledge/delivery/work-items/` **and** whose
`type` is a valid work-item type (feature/bugfix/hotfix/spike + module-registered work-item
types). Anything else — ADRs (`type: adr` in `tech/decisions/`), `current-state`, `roadmap`,
`module-design`, layer docs, untyped files — is excluded from the Work Items count/list.

## Current State recovery (intent vs reality)

`knowledge/tech/current-state.md` returns as an **optional but recommended** artifact:

| Artifact | Meaning |
|---|---|
| `codebase.md` | Intent (how we plan to build it) |
| `current-state.md` | Reality (how it is actually built) |
| ADR | Decision rationale (why) |
| `scan.json` | Technical signals (detected) |

`explain`'s knowledge status and the layers view note current-state as recommended; it does
**not** replace `codebase.md`.

## Understand improvements

Per-phase output includes concrete next steps, e.g.:

```
Current phase: Product
Recommended next steps:
  1. Run kaddo scan
  2. Run kaddo context
  3. Use capability-agent → knowledge/product/capabilities.md
```

## Docs

- Manifesto: "Knowledge is discovered progressively, but reality and intent must remain
  distinct."
- Workflow: artifact-purpose table (codebase=intent, current-state=reality, ADR=rationale,
  scan.json=signals) + command responsibilities (scan/context/understand/explain).
- Visual Guide: `scan → owners suggest → agent → human` ownership flow.
- Examples: reflect current-state, agent folders, ownership flow.

## Out of scope

Scaffold/codegen, roadmap sync, domain mapping, branch/commit automation, MCP.
