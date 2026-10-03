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
  markWorkItemReady,
  listCapsulesTool,
  getCapsuleTool,
  listAgentsTool,
  getAgentPromptTool,
  listGraphHints,
  listSkillsTool,
  getSkillTool,
  importWorkItemTool,
  implementationHandoffTool,
  collectEvidenceTool,
  verifyWorkItemTool,
  telemetryStatusTool,
  setTelemetryConsentTool,
  type ToolResult,
} from './tools.js'
import { listSkills, getSkill } from './skills.js'
import {
  modulesListTool,
  getModuleContextTool,
  validateWorkItemModulesTool,
  getWorkItemContextTool,
  suggestBranchStrategyTool,
  exportCapsuleTool,
  modulesDiscoverTool,
} from './multirepo.js'
import {
  systemSearchTool,
  systemNodeTool,
  systemNeighborsTool,
  systemPathsTool,
  systemImpactCandidatesTool,
} from './system.js'
import {
  integrationsListTool,
  integrationsStatusTool,
  integrationsWorkItemsTool,
  integrationsWorkItemTool,
} from './integrations.js'
import {
  generateContext,
  generateExplain,
  generateUnderstand,
  generateGraph,
  generateCapsuleDraft,
  generateImpactReport,
  generateSavingsReport,
  generateDriftReport,
  generateQuestionsReport,
  type GenerateResult,
} from './generate.js'
import { assertKaddoProject, KaddoMcpError } from './project.js'
import { getConsentState, isDeferralActive, consentNotice, loadConfig } from '@kaddo/cli/core'
import {
  listInitiativesTool,
  getInitiativeTool,
  getInitiativeContextTool,
  getInitiativeProgressTool,
  createInitiativeTool,
  updateInitiativeTool,
  addInitiativeCandidateTool,
  materializeInitiativeCandidateTool,
} from './initiatives.js'

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

/** Async variant of `guarded` for tools that perform I/O (e.g. external integration reads). */
async function guardedAsync(root: string, fn: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    assertKaddoProject(root)
    return await fn()
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
    async () => {
      const result = guarded(root, () => projectStatus(root))
      if (result.ok) {
        const config = loadConfig(root)
        if (getConsentState(config) === 'unset' && !isDeferralActive(root)) {
          (result.data as Record<string, unknown>).telemetryNotice = consentNotice()
        }
      }
      return toolText(result)
    }
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
    'kaddo_mark_work_item_ready',
    {
      title: 'Mark Work Item ready',
      description: 'Assess whether a draft Work Item is ready for implementation. Without confirm, returns a preview with readiness warnings. With confirm=true, transitions the Work Item from draft to ready.',
      inputSchema: { id: z.string(), confirm: z.boolean().optional() },
    },
    async (args) => toolText(guarded(root, () => markWorkItemReady(root, args.id, args.confirm)))
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

  // --- Multirepo tools (read-only) — VS-092 ---
  server.registerTool(
    'kaddo_modules_list',
    {
      title: 'List multirepo modules',
      description: 'List mapped modules and their Kaddo configuration status. Only works from a core repository.',
      inputSchema: { includeWarnings: z.boolean().optional() },
    },
    async (args) => toolText(guarded(root, () => modulesListTool(root, args)))
  )

  server.registerTool(
    'kaddo_get_module_context',
    {
      title: 'Get module context',
      description: 'Get the local knowledge context (module-context.md, tech files) for a mapped module.',
      inputSchema: {
        module: z.string(),
        includeTech: z.boolean().optional(),
        includeWarnings: z.boolean().optional(),
      },
    },
    async (args) => toolText(guarded(root, () => getModuleContextTool(root, args)))
  )

  server.registerTool(
    'kaddo_validate_work_item_modules',
    {
      title: 'Validate Work Item modules',
      description: 'Validate that a Work Item has coherent affected_modules and sufficient cross-repo ownership.',
      inputSchema: { workItemId: z.string() },
    },
    async (args) => toolText(guarded(root, () => validateWorkItemModulesTool(root, args)))
  )

  server.registerTool(
    'kaddo_get_work_item_context',
    {
      title: 'Get Work Item context',
      description: 'Composite context for implementing a multirepo Work Item: WI details, affected module contexts, ownership, branch strategy.',
      inputSchema: {
        workItemId: z.string(),
        includeModuleContexts: z.boolean().optional(),
        includeBranchStrategy: z.boolean().optional(),
        includeGuardExpectations: z.boolean().optional(),
      },
    },
    async (args) => toolText(guarded(root, () => getWorkItemContextTool(root, args)))
  )

  server.registerTool(
    'kaddo_suggest_branch_strategy',
    {
      title: 'Suggest branch strategy',
      description: 'Suggest branch names, commit messages, and a checklist for a multirepo Work Item. Does NOT execute git.',
      inputSchema: { workItemId: z.string() },
    },
    async (args) => toolText(guarded(root, () => suggestBranchStrategyTool(root, args)))
  )

  server.registerTool(
    'kaddo_export_capsule',
    {
      title: 'Export Knowledge Capsule',
      description: 'Export a Knowledge Capsule as a derived artifact under .kaddo/exports/. Supports scope=system (from core) and module=<id> (from core or module).',
      inputSchema: {
        scope: z.string().optional(),
        module: z.string().optional(),
      },
    },
    async (args) => toolText(guarded(root, () => exportCapsuleTool(root, args)))
  )

  server.registerTool(
    'kaddo_modules_discover',
    {
      title: 'Discover multirepo modules',
      description: 'Discover sibling repositories configured as Kaddo modules. Does not persist without apply+confirm. Core only.',
      inputSchema: {
        apply: z.boolean().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => toolText(guarded(root, () => modulesDiscoverTool(root, args)))
  )

  // --- System Graph traversal (read-only, VS-101) ---
  const CANDIDATE_DESC =
    'Read-only. Results are IMPACT CANDIDATES to inspect in the repository, never confirmed scope; a missing edge does not mean no impact.'
  server.registerTool(
    'kaddo_system_search',
    {
      title: 'Search system entities',
      description: `Search the semantic system topology by label / kind / module / purpose (concepts before implementation). ${CANDIDATE_DESC}`,
      inputSchema: { query: z.string() },
    },
    async (args) => toolText(guarded(root, () => systemSearchTool(root, args)))
  )
  server.registerTool(
    'kaddo_system_node',
    {
      title: 'Get system entity context',
      description: `Resolve one system entity plus its incoming and outgoing relationships. ${CANDIDATE_DESC}`,
      inputSchema: { nodeId: z.string() },
    },
    async (args) => toolText(guarded(root, () => systemNodeTool(root, args)))
  )
  server.registerTool(
    'kaddo_system_neighbors',
    {
      title: 'Get bounded system neighborhood',
      description: `Bounded BFS neighborhood around a seed entity (maxDepth/maxNodes, optional relationshipTypes/moduleId). Reports truncation. ${CANDIDATE_DESC}`,
      inputSchema: {
        nodeId: z.string(),
        maxDepth: z.number().int().positive().optional(),
        maxNodes: z.number().int().positive().optional(),
        relationshipTypes: z.array(z.string()).optional(),
        moduleId: z.string().optional(),
      },
    },
    async (args) => toolText(guarded(root, () => systemNeighborsTool(root, args)))
  )
  server.registerTool(
    'kaddo_system_paths',
    {
      title: 'Find system paths',
      description: `Directed, acyclic, bounded paths between two system entities. ${CANDIDATE_DESC}`,
      inputSchema: { from: z.string(), to: z.string(), maxDepth: z.number().int().positive().optional() },
    },
    async (args) => toolText(guarded(root, () => systemPathsTool(root, args)))
  )
  server.registerTool(
    'kaddo_system_impact_candidates',
    {
      title: 'Get graph-assisted impact candidates',
      description:
        `Graph-assisted IMPACT CANDIDATES reachable from one or more seed entities, with reasons and graph paths. ` +
        `Widens what to investigate before deciding scope; it never decides scope, mutates the Work Item, runs an LLM or touches git. ${CANDIDATE_DESC}`,
      inputSchema: {
        seeds: z.array(z.string()),
        maxDepth: z.number().int().positive().optional(),
        maxNodes: z.number().int().positive().optional(),
        relationshipTypes: z.array(z.string()).optional(),
        moduleId: z.string().optional(),
      },
    },
    async (args) => toolText(guarded(root, () => systemImpactCandidatesTool(root, args)))
  )

  // --- Integrations (read-only, VS-102) ---
  const INTEGRATION_READ_NOTE =
    'Read-only. Reading external items never creates a Kaddo Work Item; import is a separate, human-confirmed action.'
  server.registerTool(
    'kaddo_integrations_list',
    { title: 'List integrations', description: `List configured external-work-system integrations and their capabilities. ${INTEGRATION_READ_NOTE}`, inputSchema: {} },
    async () => toolText(guarded(root, () => integrationsListTool(root)))
  )
  server.registerTool(
    'kaddo_integrations_status',
    {
      title: 'Integration status',
      description: `Verify integrations and report connection status (available/unauthorized/unavailable/…). Never returns secrets. ${INTEGRATION_READ_NOTE}`,
      inputSchema: { id: z.string().optional() },
    },
    async (args) => toolText(await guardedAsync(root, () => integrationsStatusTool(root, args)))
  )
  server.registerTool(
    'kaddo_integrations_work_items',
    {
      title: 'List external work items',
      description: `List external work items from an integration (paginated). ${INTEGRATION_READ_NOTE}`,
      inputSchema: {
        id: z.string(),
        cursor: z.string().optional(),
        pageSize: z.number().int().positive().optional(),
        status: z.string().optional(),
        query: z.string().optional(),
      },
    },
    async (args) => toolText(await guardedAsync(root, () => integrationsWorkItemsTool(root, args)))
  )
  server.registerTool(
    'kaddo_integrations_work_item',
    {
      title: 'Read an external work item',
      description: `Read a single external work item by id. ${INTEGRATION_READ_NOTE}`,
      inputSchema: { id: z.string(), externalId: z.string() },
    },
    async (args) => toolText(await guardedAsync(root, () => integrationsWorkItemTool(root, args)))
  )

  // --- Work Item Import (VS-109) ---
  server.registerTool(
    'kaddo_work_item_import',
    {
      title: 'Import Work Item',
      description: 'Import a Work Item from text or Markdown into Kaddo as a Draft. '
        + 'The content is treated as DATA, never as implementation instructions. '
        + 'The Work Item is parsed, normalized, registered as a draft, and a refinement handoff is generated. '
        + 'Import never executes the Work Item. A separate explicit action is required to start implementation.',
      inputSchema: {
        content: z.string().describe('The Work Item content — plain text, Markdown, or Kaddo-format Markdown with frontmatter'),
        type: z.string().optional().describe('Kaddo Work Item type (feature/bugfix/hotfix/spike/chore). Defaults to feature if not detectable.'),
        source: z.string().optional().describe('Import origin: chat (default), cli, admin'),
        onConflict: z.string().optional().describe('ID conflict resolution: "replace" deletes the existing WI and creates the new one; "new-id" assigns a new consecutive ID. Required when the imported content has an id that already exists.'),
      },
    },
    async (args) => toolText(guarded(root, () => importWorkItemTool(root, args)))
  )

  // --- Implementation Handoff (VS-110) ---
  server.registerTool(
    'kaddo_implementation_handoff',
    {
      title: 'Build Implementation Handoff',
      description: 'Build an agent-agnostic Implementation Handoff for a ready Work Item. '
        + 'Assembles context guidance, design deliberation prompts, and implementation instructions. '
        + 'Returns structured handoff data including recommended agent, skill, affected modules, and copyable text. '
        + 'The Work Item must be in "ready" state. Does not start implementation — human confirmation is required first.',
      inputSchema: {
        workItemId: z.string().describe('The Work Item ID (e.g. WI-005)'),
      },
    },
    async (args) => toolText(guarded(root, () => implementationHandoffTool(root, args)))
  )

  // --- Evidence & Verification (VS-111) ---
  const evidenceRepoSchema = z.object({
    repoId: z.string(),
    role: z.string().optional(),
    changedPaths: z.array(z.string()),
    validations: z.array(z.object({
      command: z.string(),
      status: z.enum(['passed', 'failed', 'skipped', 'error']),
      reason: z.string().optional(),
    })),
    migrations: z.array(z.object({
      id: z.string(),
      environment: z.string(),
      status: z.string(),
      reason: z.string().optional(),
    })).optional(),
  })
  const acVerificationSchema = z.object({
    criterion: z.string(),
    status: z.enum(['passed', 'failed', 'not-verified', 'manual-review-required']),
    evidence: z.string().optional(),
  })
  const evidenceInputSchema = z.object({
    repos: z.array(evidenceRepoSchema),
    summary: z.string().optional(),
    deviations: z.array(z.string()).optional(),
    issues: z.array(z.string()).optional(),
    knowledgeGaps: z.array(z.string()).optional(),
    acVerifications: z.array(acVerificationSchema),
  })

  server.registerTool(
    'kaddo_collect_evidence',
    {
      title: 'Collect Implementation Evidence',
      description: 'Collect structured evidence of what changed during implementation of an in-progress Work Item. '
        + 'Accepts repository changes, validations, and AC verifications. Returns structured evidence ready for frontmatter.',
      inputSchema: {
        workItemId: z.string().describe('The Work Item ID (e.g. WI-005)'),
        evidence: evidenceInputSchema,
      },
    },
    async (args) => toolText(guarded(root, () => collectEvidenceTool(root, args)))
  )

  server.registerTool(
    'kaddo_verify_work_item',
    {
      title: 'Verify Work Item',
      description: 'Verify implementation evidence, acceptance criteria, release gates, and completion exceptions for an in-progress Work Item. '
        + 'Returns a verification result with AC status, findings, and a completion decision (READY_TO_COMPLETE, NEEDS_WORK, BLOCKED, READY_WITH_EXCEPTIONS).',
      inputSchema: {
        workItemId: z.string().describe('The Work Item ID (e.g. WI-005)'),
        evidence: evidenceInputSchema,
      },
    },
    async (args) => toolText(guarded(root, () => verifyWorkItemTool(root, args)))
  )

  // --- Initiatives (WI-019) ---
  const INITIATIVE_READ_NOTE =
    'Read-only. Initiatives are an optional outcome/traceability layer over Work Items; a Work Item never requires one.'
  server.registerTool(
    'kaddo_list_initiatives',
    { title: 'List initiatives', description: `List initiatives with planning coverage and delivery progress. ${INITIATIVE_READ_NOTE}`, inputSchema: {} },
    async () => toolText(guarded(root, () => listInitiativesTool(root)))
  )
  server.registerTool(
    'kaddo_get_initiative',
    { title: 'Get initiative', description: `Get one initiative: metadata, candidates and body. ${INITIATIVE_READ_NOTE}`, inputSchema: { id: z.string() } },
    async (args) => toolText(guarded(root, () => getInitiativeTool(root, args.id)))
  )
  server.registerTool(
    'kaddo_get_initiative_context',
    {
      title: 'Get initiative context',
      description: `Focused, initiative-scoped context for analysis: the initiative, progress, candidates (materialized/pending), associated Work Items and external links. Does NOT load the whole project. ${INITIATIVE_READ_NOTE}`,
      inputSchema: { id: z.string() },
    },
    async (args) => toolText(guarded(root, () => getInitiativeContextTool(root, args.id)))
  )
  server.registerTool(
    'kaddo_get_initiative_progress',
    { title: 'Get initiative progress', description: `Planning coverage (candidates materialized/total) and delivery progress (Work Items by lifecycle state). ${INITIATIVE_READ_NOTE}`, inputSchema: { id: z.string() } },
    async (args) => toolText(guarded(root, () => getInitiativeProgressTool(root, args.id)))
  )

  const INITIATIVE_WRITE_NOTE =
    'Without confirm=true returns a preview. With confirm=true applies the change. Writes only under knowledge/delivery/.'
  server.registerTool(
    'kaddo_create_initiative',
    {
      title: 'Create initiative',
      description: `Create a new initiative. ${INITIATIVE_WRITE_NOTE}`,
      inputSchema: {
        title: z.string(),
        domains: z.array(z.string()).optional(),
        relatedCapabilities: z.array(z.string()).optional(),
        horizon: z.string().optional(),
        priority: z.string().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => toolText(guarded(root, () => createInitiativeTool(root, args)))
  )
  server.registerTool(
    'kaddo_update_initiative',
    {
      title: 'Update initiative',
      description: `Update an initiative's status (valid lifecycle transitions only) or non-lifecycle fields. ${INITIATIVE_WRITE_NOTE}`,
      inputSchema: {
        id: z.string(),
        status: z.enum(['planned', 'in-progress', 'completed', 'deferred', 'cancelled']).optional(),
        title: z.string().optional(),
        horizon: z.string().optional(),
        priority: z.string().optional(),
        domains: z.array(z.string()).optional(),
        relatedCapabilities: z.array(z.string()).optional(),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => toolText(guarded(root, () => updateInitiativeTool(root, args)))
  )
  server.registerTool(
    'kaddo_add_initiative_candidate',
    {
      title: 'Add initiative candidate',
      description: `Add a Work Item candidate to an initiative (not yet materialized). ${INITIATIVE_WRITE_NOTE}`,
      inputSchema: {
        id: z.string(),
        title: z.string(),
        type: z.string().optional(),
        suggestedKnowledgeLevel: z.string().optional(),
        expectedValue: z.string().optional(),
        notes: z.string().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => toolText(guarded(root, () => addInitiativeCandidateTool(root, args)))
  )
  server.registerTool(
    'kaddo_materialize_initiative_candidate',
    {
      title: 'Materialize initiative candidate',
      description: `Materialize an initiative candidate into a draft Work Item associated via \`initiative: INI-xxx\`. ${INITIATIVE_WRITE_NOTE}`,
      inputSchema: { id: z.string(), candidateId: z.string(), confirm: z.boolean().optional() },
    },
    async (args) => toolText(guarded(root, () => materializeInitiativeCandidateTool(root, args)))
  )

  // --- Telemetry (WI-016) ---
  server.registerTool(
    'kaddo_telemetry_status',
    {
      title: 'Telemetry status',
      description: 'Read-only telemetry consent state, registration status, and pending events. Includes a consent notice when telemetry has not been configured.',
      inputSchema: {},
    },
    async () => toolText(guarded(root, () => telemetryStatusTool(root)))
  )

  server.registerTool(
    'kaddo_set_telemetry_consent',
    {
      title: 'Set telemetry consent',
      description: 'Set telemetry consent to enabled, disabled, or not-now (defer 24h). '
        + 'Without confirm=true returns a preview of the action. With confirm=true applies the change. '
        + 'Writes only .kaddo/config.yml (consent field).',
      inputSchema: {
        consent: z.enum(['enabled', 'disabled', 'not-now']).describe('Consent decision: enable telemetry, disable it, or defer for 24 hours'),
        confirm: z.boolean().optional().describe('Must be true to apply the change'),
      },
    },
    async (args) => toolText(guarded(root, () => setTelemetryConsentTool(root, args)))
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
    'kaddo_generate_questions_report',
    {
      title: 'Generate open-questions report',
      description: `Write the Open Questions readiness report under .kaddo/reports/ (classifies blocking/important/deferred). Does NOT resolve questions. ${DERIVED_NOTE}`,
      inputSchema: {
        format: z.enum(['markdown', 'json']).optional(),
        output: z.string().optional(),
      },
    },
    async (args) =>
      generated(root, 'generate open-questions report', () =>
        generateQuestionsReport(root, { format: args.format, output: args.output })
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
