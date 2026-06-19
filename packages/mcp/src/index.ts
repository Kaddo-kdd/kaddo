// @kaddo/mcp entry point (VS-057). Read-only MCP server over Kaddo project knowledge, local stdio
// transport. Resolves the project from KADDO_PROJECT_DIR or the current working directory.

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server.js'
import { projectRoot } from './project.js'

async function main(): Promise<void> {
  const root = projectRoot()
  const server = createServer(root)
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // Log to stderr only — stdout is the MCP protocol channel.
  process.stderr.write(`[kaddo-mcp] read-only server ready (project: ${root})\n`)
}

main().catch((err) => {
  process.stderr.write(`[kaddo-mcp] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`)
  process.exit(1)
})
