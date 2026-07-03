---
title: Installed Assets (agent & skill versions)
description: Kaddo versions the operational knowledge it installs. kaddo agents status / skills status show whether your installed agents and skills are aligned with the current package.
---

The CLI version doesn't guarantee the version of the **agents and skills installed in your project**.
An updated `@kaddo/cli` can still sit next to `capability-agent.md` or `adr-writing/skill.md` generated
by an older release — which can make behavior inconsistent. Kaddo now versions that operational
knowledge and reports whether it's aligned.

```bash
kaddo agents status     # installed agents, their version and state
kaddo skills status     # installed skills, their version and state
kaddo agents update     # refresh outdated agents (never overwrites edits without --force)
kaddo skills update
```

Installed agents and skills carry a `version:` front-matter field set to the Kaddo package version at
install time. `kaddo add agents` / `kaddo add skills` write it automatically.

## States

Each installed agent/skill is classified against the current package:

| State | Meaning | `update` |
|---|---|---|
| `up-to-date` | installed version = package version, content matches | nothing |
| `outdated` | installed version is lower | refreshed |
| `unknown-version` | file has no `version:` (installed before this feature) | skipped unless `--force` |
| `modified` | version matches but the content was edited locally | skipped unless `--force` |
| `missing` | the catalog asset isn't installed | left to `kaddo add` |

`update` is safe by default: it refreshes `outdated` assets but **never overwrites** a `modified` or
`unknown-version` file without `--force`, so local edits are protected. It never calls an LLM or runs
git.

## Where it surfaces

- `kaddo explain` shows a compact `## Installed Assets` block (CLI version + counts of
  outdated/unknown/modified) and suggests running the status commands.
- `kaddo understand` warns when a **recommended** agent is outdated.
- `kaddo context` (`.kaddo/context-pack.json`) carries an `installedAssets` summary.
- The read-only MCP resource `kaddo://installed-assets` returns the same status for connected agents;
  it never updates.

## The rule

> Kaddo doesn't only version the CLI — it versions the operational knowledge (agents and skills) it
> installs in the project.
