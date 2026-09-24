---
title: Kaddo Power for Kiro
description: Install Kaddo as a Kiro Power with portable Skills, KDD workflow guidance and on-demand MCP access to project knowledge.
---

![Kaddo Power logo](/kaddo-power-icon.png)

**kaddo-power** is the official Kaddo integration for [Kiro Powers](https://kiro.dev/docs/powers/).
It packages portable Kaddo Skills, Kiro-specific workflow guidance and the published `@kaddo/mcp`
server as an Agent Plugins 1.0 package.

The Power does not replace Kaddo Core, the CLI or project knowledge. It helps Kiro discover the
right structured context before exploring source files.

```text
Kaddo knowledge -> kaddo-power -> Kiro activation -> focused agent workflow
                         |
                         +-> @kaddo/mcp -> project resources and lifecycle tools
```

## Install from GitHub

1. Open the **Powers** panel in Kiro.
2. Choose **Add Custom Power**.
3. Select **Import power from GitHub**.
4. Enter `https://github.com/Kaddo-kdd/kaddo/tree/main/kaddo-power`.
5. Review the bundled Skills and MCP command, then enable **kaddo-power**.

If an older custom Power named `agent-plugin` or `Kaddo Power` is installed, remove it before
installing the current path. Kiro derives the visible name of a custom GitHub Power from that path.

For a local checkout, choose **Import power from a folder** and select `kaddo-power/`.

## Requirements

- Kiro with Agent Plugins support.
- Node.js 18 or newer with `npx` available.
- A repository initialized with Kaddo.
- `KADDO_PROJECT_DIR` bound to the repository when the client does not provide the project root.

Initialize project knowledge when needed:

```bash
npx -y @kaddo/cli init
npx -y @kaddo/cli scan
```

## What it includes

| Component | Purpose |
| --- | --- |
| `plugin.json` | Portable identity, version and activation keywords |
| `skills/` | Generated Agent Skills backed by Kaddo's canonical Skill definitions |
| `mcp.json` | On-demand access to the published `@kaddo/mcp` server |
| `dev.kiro/steering/` | Kiro-specific onboarding, resources and operating boundaries |

The plugin includes Skills for ADR writing, Work Item refinement, ownership suggestions, graph
metadata review, capsule writing, learning capture, implementation planning and module-context
refinement.

## Power vs. Kiro adapter

The Power and the [Kiro adapter](kiro-adapter/) are complementary:

| Integration | Use it when |
| --- | --- |
| `kaddo-power` | You want dynamic Power activation, portable Skills and bundled MCP discovery |
| `kaddo adapters install kiro` | You want persistent repository instructions in a generated root `AGENTS.md` |

Installing the Power does not generate or modify `AGENTS.md`. Installing the adapter does not
install a Kiro Power.

## Safety boundaries

The Power guides Kiro to read structured knowledge first and verify relevant implementation details
afterward. It does not authorize the agent to mark Work Items ready, accept decisions, expand scope,
commit, push or perform irreversible actions without human confirmation.

Kaddo remains the source of truth. Generated files under `.kaddo/` should be regenerated through
Kaddo rather than edited manually.

## Logo

The official square logo is included at `kaddo-power/assets/icon.png` and is used by this
documentation. Agent Plugins 1.0 does not define portable icon metadata, so a custom Kiro import may
still display Kiro's default Power icon. A catalog listing can use the supplied asset.

## Update

Open **Powers**, select **kaddo-power**, and choose **Check for updates**. The version in
`plugin.json` allows Kiro to detect refreshed package contents.

