# Kaddo Power

The official portable Agent Plugin for [Kaddo](https://kaddo.trycatch.tv/), the Knowledge Driven
Development toolkit. It packages discovery, activation, agent guidance, portable Skills and
`@kaddo/mcp` integration. Kiro is the first supported consumer, but the portable plugin is not
defined by Kiro.

The plugin orchestrates existing Kaddo capabilities. It does not reimplement Kaddo Core, CLI, MCP,
agents or Skills.

## Why it exists

Kaddo turns project knowledge into structured context so agents can reduce unnecessary repository
exploration. The Agent Plugin makes that context and the KDD workflow discoverable from compatible
agent clients.

```text
Kaddo knowledge -> Agent Plugin -> client activation -> agent workflow
                       |
                       +-> @kaddo/mcp -> project knowledge and lifecycle actions
```

## Requirements

- An Agent Plugins 1.0 compatible client. Kiro Powers is the first supported client.
- Node.js 18 or newer with `npx` available.
- A repository initialized with Kaddo (`.kaddo/config.yml` and `knowledge/`).
- `@kaddo/cli` when CLI commands or the Kiro adapter are used.

Initialize a repository when needed:

```bash
npx -y @kaddo/cli init
npx -y @kaddo/cli scan
```

## Installation

### Kiro Power

Until registry distribution is handled separately, load this directory as a custom Power. Kiro
derives the visible custom Power name from the imported directory or GitHub path, so keep the
directory name `Kaddo Power` intact.

For a GitHub installation:

1. Remove the previously installed `agent-plugin` custom Power, if present.
2. Open the Kiro Powers panel.
3. Choose **Add Custom Power** and **Import power from GitHub**.
4. Enter `https://github.com/Kaddo-kdd/kaddo/tree/main/Kaddo%20Power`.
5. Review the bundled Skills and MCP command before enabling **Kaddo Power**.

For a local checkout:

1. Open the Kiro Powers panel.
2. Choose **Add Custom Power** and **Import power from a folder**.
3. Select `Kaddo Power/`.
4. Review the bundled Skills and MCP command before enabling **Kaddo Power**.

The Power contains `mcp.json`, so do not add a second identical MCP server unless the bundled
server cannot receive the repository path. Registry publication and one-click distribution are not
part of this integration.

### Other compatible clients

Load `Kaddo Power/` using the client's Agent Plugins installation flow. The client must support
the Skills and/or MCP component types it intends to use. Client-specific installation and project
root binding are controlled by that client.

## MCP configuration

The bundled manifest launches the published server with:

```text
npx -y @kaddo/mcp
```

`@kaddo/mcp` resolves the target repository from `KADDO_PROJECT_DIR`, falling back to the process
working directory. Agent Plugins 1.0 standardizes only `${PLUGIN_ROOT}` and `${PLUGIN_DATA}`;
`${KADDO_PROJECT_DIR}` is therefore a Kiro-supported environment reference, not a portable Agent
Plugins variable.

For Kiro, set `KADDO_PROJECT_DIR` to the absolute path of the Kaddo-enabled repository and approve
the variable under **MCP Approved Env Vars**. When the Power cannot inherit or expand that variable,
use one workspace server in `.kiro/settings/mcp.json` instead. Do not leave both connections active;
if the installed Kiro version cannot disable the bundled connection independently, configure and
approve `KADDO_PROJECT_DIR` instead of adding a duplicate server:

```json
{
  "mcpServers": {
    "kaddo": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@kaddo/mcp"],
      "env": {
        "KADDO_PROJECT_DIR": "/absolute/path/to/repository"
      }
    }
  }
}
```

This workspace setup is required only when the installed Power cannot bind its MCP process to the
open repository. The plugin does not claim zero-configuration project detection.

## Verify the integration

1. Confirm that Kiro reports the Kaddo MCP server as connected.
2. Ask for the current Kaddo project status.
3. Confirm the response describes the open repository rather than the plugin installation folder.
4. Ask for available Work Items and select one yourself.
5. Request refinement or an implementation plan and verify that Kiro stops at the documented human
   confirmation points.

If project status says that no Kaddo project was found, correct `KADDO_PROJECT_DIR` or the workspace
MCP configuration before continuing.

## Skills

The `skills/` directory is generated from the canonical definitions in
[`packages/cli/src/skills/skills.ts`](../packages/cli/src/skills/skills.ts). Agent Plugin files adapt
only the front matter required by the Agent Skills format; their methodology remains owned by
Kaddo.

```bash
pnpm agent-plugin:sync   # regenerate portable SKILL.md files
pnpm agent-plugin:check  # fail when generated files have drifted
```

Do not edit generated `Kaddo Power/skills/*/SKILL.md` files directly. Change canonical Kaddo Skills
only for an actual Kaddo behavior correction, then regenerate. Kiro-specific workflow guidance
belongs under `dev.kiro/`.

## Responsibility boundaries

| Component | Owns |
| --- | --- |
| Kaddo Core and CLI | Deterministic project lifecycle, generation, validation and Guard behavior |
| `@kaddo/mcp` | Current tools, resources, prompts, parameters and schemas |
| Canonical Kaddo Skills | Reusable KDD methodology |
| Kaddo Agent Plugin | Packaging, discovery, activation, portable Skills and MCP integration |
| Kiro guidance under `dev.kiro/` | Kiro activation and client-specific operating guidance |
| `kaddo adapters install kiro` | Repository-specific `AGENTS.md` instructions and project conventions |

Use the tools and resources exposed by the installed `@kaddo/mcp` version. This README intentionally
does not duplicate its complete API inventory. See the canonical
[`@kaddo/mcp` documentation](../packages/mcp/README.md) for the server contract.

The Agent Plugin and Kiro adapter are complementary. Installing the Power supplies portable
capabilities; running `kaddo adapters install kiro` supplies persistent repository instructions.
Neither installation should create a second MCP declaration automatically.

## Human-in-the-loop behavior

The plugin follows Kaddo's existing decision boundary:

```text
Agent discovers -> analyzes -> proposes -> human validates -> Kaddo records -> agent continues
```

Agents must not autonomously:

- mark a Work Item ready or expand its confirmed scope;
- resolve open questions or accept architecture decisions;
- treat graph impact candidates as confirmed scope;
- change business decisions silently;
- commit or push code; or
- make irreversible project decisions.

Graph traversal is evidence for investigation. Unknown surfaces remain unknown until reviewed, and
Work Item readiness still requires the confirmation defined by Kaddo.

## Kiro workflow

Kiro-specific steering lives in `dev.kiro/steering/`. It guides Kiro to:

1. Assess project health from Kaddo context.
2. Present Work Items for human selection.
3. Refine scope across product, frontend, backend, data, configuration, security, notifications,
   analytics, documentation, operations and mapped modules.
4. Preview readiness and wait for human confirmation.
5. Produce an implementation plan and wait for approval.
6. Implement only confirmed scope, validate it, run Guard and capture learning.

The steering names individual MCP capabilities only where a workflow needs them. Discovery and the
installed MCP server remain the source of truth for the full API.

## Development validation

From the repository root:

```bash
pnpm agent-plugin:check
pnpm test
pnpm build
```

Automated checks cover manifest constraints, required structure, internal references and generated
Skill drift. A real Kiro smoke test remains manual because CI cannot reproduce the installed Power,
workspace trust and approved environment configuration.

## Contributors

The initial Kaddo Agent Plugin / Kiro Power implementation was contributed by **Esteban Fonseca**.

Product ownership remains with Kaddo. Esteban's original Git commits and authorship are preserved in
the repository history.

## License

MIT. See the repository root [`LICENSE`](../LICENSE).
