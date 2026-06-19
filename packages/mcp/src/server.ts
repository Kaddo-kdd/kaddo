// MCP server wiring (VS-057). The only module that depends on the MCP SDK. It binds the SDK-free
// resource/tool/prompt builders to an McpServer. Everything stays read-only.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { RESOURCES } from './resources.js'
import { listPrompts, getPrompt } from './prompts.js'
import {
  projectStatus,
  listWorkItemsTool,
  getWorkItem,
  listCapsulesTool,
  getCapsuleTool,
  listAgentsTool,
  getAgentPromptTool,
  listGraphHints,
  type ToolResult,
} from './tools.js'
import { assertKaddoProject, KaddoMcpError } from './project.js'

export const SERVER_NAME = 'kaddo'
export const SERVER_VERSION = '3.19.0'

function toolText(result: ToolResult) {
  if (!result.ok) {
    return { content: [{ type: 'text' as const, text: result.message }], isError: true }
  }
  const text = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)
  return { content: [{ type: 'text' as const, text }] }
}

/** Run a read function under the Kaddo-project guard; map KaddoMcpError to a ToolResult. */
function guarded(root: string, fn: () => ToolResult): ToolResult {
  try {
    assertKaddoProject(root)
    return fn()
  } catch (err) {
    if (err instanceof KaddoMcpError) return { ok: false, message: err.message }
    throw err
  }
}

export function createServer(root: string): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION })

  // --- Resources ---
  for (const r of RESOURCES) {
    server.registerResource(
      r.name,
      r.uri,
      { title: r.name, description: r.description, mimeType: r.mimeType },
      async (uri) => {
        try {
          assertKaddoProject(root)
        } catch (err) {
          const message = err instanceof KaddoMcpError ? err.message : String(err)
          return { contents: [{ uri: uri.href, text: message, mimeType: 'text/plain' }] }
        }
        const parts = r.read(root)
        return { contents: parts.map((p) => ({ uri: p.uri, text: p.text, mimeType: p.mimeType })) }
      }
    )
  }

  // --- Tools (read-only) ---
  server.registerTool(
    'kaddo_project_status',
    { title: 'Kaddo project status', description: 'Compact project status (state, phase, work items, ownership, graph quality, capsules).', inputSchema: {} },
    async () => toolText(guarded(root, () => projectStatus(root)))
  )

  server.registerTool(
    'kaddo_list_work_items',
    {
      title: 'List Work Items',
      description: 'List Work Items with optional status/type/knowledge_level filters.',
      inputSchema: {
        status: z.string().optional(),
        type: z.string().optional(),
        knowledge_level: z.string().optional(),
      },
    },
    async (args) => toolText(guarded(root, () => listWorkItemsTool(root, args)))
  )

  server.registerTool(
    'kaddo_get_work_item',
    { title: 'Get Work Item', description: 'Get a Work Item by ID (summary + full markdown).', inputSchema: { id: z.string() } },
    async (args) => toolText(guarded(root, () => getWorkItem(root, args.id)))
  )

  server.registerTool(
    'kaddo_list_capsules',
    { title: 'List Knowledge Capsules', description: 'List registered external Knowledge Capsules.', inputSchema: {} },
    async () => toolText(guarded(root, () => listCapsulesTool(root)))
  )

  server.registerTool(
    'kaddo_get_capsule',
    { title: 'Get Knowledge Capsule', description: 'Get an external Knowledge Capsule by ID.', inputSchema: { id: z.string() } },
    async (args) => toolText(guarded(root, () => getCapsuleTool(root, args.id)))
  )

  server.registerTool(
    'kaddo_list_agents',
    { title: 'List agents', description: 'List installed agent prompts.', inputSchema: {} },
    async () => toolText(guarded(root, () => listAgentsTool(root)))
  )

  server.registerTool(
    'kaddo_get_agent_prompt',
    { title: 'Get agent prompt', description: 'Get an installed agent prompt by name.', inputSchema: { name: z.string() } },
    async (args) => toolText(guarded(root, () => getAgentPromptTool(root, args.name)))
  )

  server.registerTool(
    'kaddo_list_graph_hints',
    {
      title: 'List graph hints',
      description: 'List knowledge-graph relationship hints with optional filters.',
      inputSchema: {
        artifact_type: z.string().optional(),
        severity: z.string().optional(),
        active_only: z.boolean().optional(),
      },
    },
    async (args) => toolText(guarded(root, () => listGraphHints(root, args)))
  )

  // --- Prompts (installed agent prompts) ---
  let prompts: ReturnType<typeof listPrompts> = []
  try {
    assertKaddoProject(root)
    prompts = listPrompts(root)
  } catch {
    prompts = []
  }
  for (const p of prompts) {
    server.registerPrompt(
      p.name,
      { title: p.name, description: p.description },
      async () => {
        const full = getPrompt(root, p.name)
        const content = full?.content ?? `Agent "${p.name}" is not installed.`
        return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text: content } }] }
      }
    )
  }

  return server
}
