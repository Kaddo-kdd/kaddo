// MCP server wiring (VS-057). The only module that depends on the MCP SDK. It binds the SDK-free
// resource/tool/prompt builders to an McpServer. Everything stays read-only.

import { createRequire } from 'node:module'
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
  listSkillsTool,
  getSkillTool,
  type ToolResult,
} from './tools.js'
import { listSkills, getSkill } from './skills.js'
import {
  generateContext,
  generateExplain,
  generateUnderstand,
  generateGraph,
  generateCapsuleDraft,
  generateImpactReport,
  generateSavingsReport,
  generateDriftReport,
  type GenerateResult,
} from './generate.js'
import { assertKaddoProject, KaddoMcpError } from './project.js'

export const SERVER_NAME = 'kaddo'
// Read the version from package.json at runtime so it never drifts from the published version.
const require = createRequire(import.meta.url)
export const SERVER_VERSION = (require('../package.json') as { version: string }).version

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

/** Run a derived-generation tool under the project guard; map errors to MCP tool content. */
function generated(root: string, label: string, fn: () => GenerateResult) {
  try {
    assertKaddoProject(root)
    const result = fn()
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  } catch (err) {
    const message = err instanceof KaddoMcpError ? err.message : `Could not ${label}. ${String(err)}`
    return { content: [{ type: 'text' as const, text: message }], isError: true }
  }
}

const DERIVED_NOTE =
  'Writes only derived files under .kaddo/. Does not modify knowledge, source code, external context or git.'

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

  server.registerTool(
    'kaddo_list_skills',
    { title: 'List skills', description: 'List installed reusable skills.', inputSchema: {} },
    async () => toolText(guarded(root, () => listSkillsTool(root)))
  )
  server.registerTool(
    'kaddo_get_skill',
    { title: 'Get skill', description: 'Get an installed reusable skill by id.', inputSchema: { id: z.string() } },
    async (args) => toolText(guarded(root, () => getSkillTool(root, args.id)))
  )

  // --- Per-skill resources (kaddo://skills/<id>) — VS-059 ---
  let installedSkills: ReturnType<typeof listSkills> = []
  try {
    assertKaddoProject(root)
    installedSkills = listSkills(root)
  } catch {
    installedSkills = []
  }
  for (const s of installedSkills) {
    server.registerResource(
      `skill: ${s.id}`,
      `kaddo://skills/${s.id}`,
      { title: s.title, description: `Reusable skill "${s.id}" (${s.group}).`, mimeType: 'text/markdown' },
      async (uri) => {
        const full = getSkill(root, s.id)
        return {
          contents: [
            { uri: uri.href, text: full?.content ?? `Skill "${s.id}" not found.`, mimeType: 'text/markdown' },
          ],
        }
      }
    )
  }

  // --- Derived tools (write only under .kaddo/) — VS-058 ---
  server.registerTool(
    'kaddo_generate_context',
    { title: 'Generate context pack', description: `Regenerate .kaddo/context-pack.md + .json. ${DERIVED_NOTE}`, inputSchema: {} },
    async () => generated(root, 'generate context pack', () => generateContext(root))
  )
  server.registerTool(
    'kaddo_generate_explain',
    { title: 'Generate explain', description: `Regenerate .kaddo/explain.md + .json. ${DERIVED_NOTE}`, inputSchema: {} },
    async () => generated(root, 'generate explain', () => generateExplain(root))
  )
  server.registerTool(
    'kaddo_generate_understand',
    { title: 'Generate understand', description: `Regenerate .kaddo/understand.md. ${DERIVED_NOTE}`, inputSchema: {} },
    async () => generated(root, 'generate understand', () => generateUnderstand(root))
  )
  server.registerTool(
    'kaddo_generate_graph',
    {
      title: 'Generate knowledge graph',
      description: `Regenerate .kaddo/graph.json/.mmd + graph-hints.md/.json. scope: active (default) or all. ${DERIVED_NOTE}`,
      inputSchema: { scope: z.enum(['active', 'all']).optional() },
    },
    async (args) => generated(root, 'generate knowledge graph', () => generateGraph(root, args.scope ?? 'active'))
  )
  server.registerTool(
    'kaddo_generate_impact_report',
    {
      title: 'Generate impact report',
      description: `Write the Knowledge Impact Report under .kaddo/reports/. format: markdown (default) or json; scope: active or all (default all). ${DERIVED_NOTE}`,
      inputSchema: {
        format: z.enum(['markdown', 'json']).optional(),
        scope: z.enum(['active', 'all']).optional(),
        output: z.string().optional(),
      },
    },
    async (args) =>
      generated(root, 'generate impact report', () =>
        generateImpactReport(root, { format: args.format, scope: args.scope, output: args.output })
      )
  )

  server.registerTool(
    'kaddo_generate_savings_report',
    {
      title: 'Generate savings report',
      description: `Write the Estimated Savings Report under .kaddo/reports/. format: markdown (default) or json; scope: active or all (default all). Evidence-based estimates, not exact ROI. ${DERIVED_NOTE}`,
      inputSchema: {
        format: z.enum(['markdown', 'json']).optional(),
        scope: z.enum(['active', 'all']).optional(),
        output: z.string().optional(),
      },
    },
    async (args) =>
      generated(root, 'generate savings report', () =>
        generateSavingsReport(root, { format: args.format, scope: args.scope, output: args.output })
      )
  )

  server.registerTool(
    'kaddo_generate_drift_report',
    {
      title: 'Generate drift report',
      description: `Write the Drift Trend Report under .kaddo/reports/ from recorded guard history. format: markdown (default) or json. Does NOT record guard runs. ${DERIVED_NOTE}`,
      inputSchema: {
        format: z.enum(['markdown', 'json']).optional(),
        output: z.string().optional(),
      },
    },
    async (args) =>
      generated(root, 'generate drift report', () =>
        generateDriftReport(root, { format: args.format, output: args.output })
      )
  )

  server.registerTool(
    'kaddo_generate_capsule_draft',
    { title: 'Generate capsule draft', description: `Write a capsule DRAFT under .kaddo/exports/ (never registers it). ${DERIVED_NOTE}`, inputSchema: {} },
    async () => generated(root, 'generate capsule draft', () => generateCapsuleDraft(root))
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

  // Installed skills are also exposed as reusable prompts (VS-059).
  for (const s of installedSkills) {
    server.registerPrompt(
      `skill-${s.id}`,
      { title: s.title, description: `Reusable skill "${s.id}" (${s.group}).` },
      async () => {
        const full = getSkill(root, s.id)
        const content = full?.content ?? `Skill "${s.id}" is not installed.`
        return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text: content } }] }
      }
    )
  }

  return server
}
