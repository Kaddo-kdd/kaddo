# Kaddo MCP server — example configuration

This folder shows how to wire the read-only [`@kaddo/mcp`](https://www.npmjs.com/package/@kaddo/mcp)
server into an MCP-compatible client (IDE or agent).

## 1. Generate Kaddo knowledge first

The MCP server is read-only — it never generates files. Run the relevant Kaddo CLI commands in your
project so there is something to expose:

```bash
kaddo init          # if the project is not a Kaddo project yet
kaddo context       # → .kaddo/context-pack.md
kaddo explain       # → .kaddo/explain.md / .json
kaddo understand    # → .kaddo/understand.md
kaddo graph export  # → .kaddo/graph.json / .mmd + graph-hints
kaddo add agents    # → knowledge/agents/** (exposed as MCP prompts)
```

## 2. Add the server to your MCP client

Copy [`mcp-config.example.json`](./mcp-config.example.json) into your client's MCP settings and set
`cwd` to the **absolute path** of your project (the directory that contains `.kaddo/`,
`knowledge/` and optionally `external/`):

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

## 3. Use it

Your agent can now read `kaddo://context-pack`, `kaddo://work-items`, `kaddo://graph`,
`kaddo://graph-hints`, call tools like `kaddo_project_status` / `kaddo_list_work_items`, and use the
installed agent prompts — all without scanning your source code.

See the full [MCP Server documentation](https://kaddo.trycatch.tv/mcp-server/).
