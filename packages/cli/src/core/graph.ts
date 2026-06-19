// Knowledge Graph Export (VS-055).
//
// Kaddo already captures connected knowledge across Markdown, front matter, Work Items, ADRs,
// roadmap, ownership and Knowledge Capsules — but only implicitly. `buildGraph` makes those
// connections explicit as a lightweight, file-based knowledge graph (NOT a graph database).
//
// Deterministic: it reads only knowledge artifacts and the external registry — never `src/`, never
// source code content, never secrets — and never calls an LLM.

import { exists, readFile, join } from '../utils/fs.js'
import { discoverKnowledge, type KnowledgeArtifact } from '../services/knowledge-artifacts.js'
import { loadExternalRegistry } from './capsule.js'
import { isActiveState } from './lifecycle.js'
import type { KaddoConfig } from './config.js'

const KNOWLEDGE = 'knowledge'

export type GraphScope = 'active' | 'all'

export type GraphNodeType =
  | 'business'
  | 'product'
  | 'tech'
  | 'delivery'
  | 'capability'
  | 'decision'
  | 'work-item'
  | 'code-glob'
  | 'initiative'
  | 'roadmap-candidate'
  | 'knowledge-capsule'
  | 'project'

export type GraphEdgeType =
  | 'informs'
  | 'belongs_to'
  | 'materialized_as'
  | 'owns'
  | 'implements'
  | 'depends_on'
  | 'governs'
  | 'provides_external_context'

export type GraphNode = {
  id: string
  type: GraphNodeType
  label: string
  path?: string
  status?: string
  knowledge_level?: string
}

export type GraphEdge = { from: string; to: string; type: GraphEdgeType }

export type KnowledgeGraph = {
  generated_at: string
  project: { name: string; state: string; structure: string }
  nodes: GraphNode[]
  edges: GraphEdge[]
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function isAdr(a: KnowledgeArtifact): boolean {
  return toPosix(a.filePath).includes('/tech/decisions/') && Boolean(a.type)
}

/**
 * Build the lightweight knowledge graph from existing artifacts. Pure: takes the project dir and
 * a loaded config; never mutates anything.
 */
export function buildGraph(
  dir: string,
  config: KaddoConfig,
  opts: { scope?: GraphScope } = {},
  now: Date = new Date()
): KnowledgeGraph {
  const scope: GraphScope = opts.scope ?? 'active'
  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const edgeKeys = new Set<string>()

  const addNode = (node: GraphNode) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node)
  }
  const addEdge = (from: string, to: string, type: GraphEdgeType) => {
    const key = `${from}|${to}|${type}`
    if (edgeKeys.has(key)) return
    edgeKeys.add(key)
    edges.push({ from, to, type })
  }

  // --- Knowledge-layer nodes + informs chain (business → product → tech → delivery) ---
  const layerDocs: { id: string; type: GraphNodeType; label: string; files: string[] }[] = [
    { id: 'business:business', type: 'business', label: 'Business', files: ['business/business.md'] },
    { id: 'product:product', type: 'product', label: 'Product', files: ['product/product.md', 'product/capabilities.md'] },
    { id: 'tech:tech', type: 'tech', label: 'Tech', files: ['tech/current-state.md', 'tech/codebase.md'] },
    { id: 'delivery:delivery', type: 'delivery', label: 'Delivery', files: ['delivery/roadmap.md'] },
  ]
  const presentLayers: string[] = []
  for (const layer of layerDocs) {
    const path = layer.files.map((f) => `${KNOWLEDGE}/${f}`).find((rel) => exists(join(dir, rel)))
    if (path) {
      addNode({ id: layer.id, type: layer.type, label: layer.label, path })
      presentLayers.push(layer.id)
    }
  }
  for (let i = 0; i < presentLayers.length - 1; i++) {
    addEdge(presentLayers[i], presentLayers[i + 1], 'informs')
  }

  // --- Work Items (+ code, capabilities, decisions, initiative, candidate) ---
  const all = discoverKnowledge(dir)
  const workItems = all.filter((a) => a.isWorkItem)
  const selectedWIs = scope === 'active'
    ? workItems.filter((a) => a.lifecycle && isActiveState(a.lifecycle))
    : workItems

  for (const wi of selectedWIs) {
    const id = wi.id || wi.title
    const wiNodeId = `wi:${id}`
    addNode({
      id: wiNodeId,
      type: 'work-item',
      label: `${id} ${wi.title}`.trim(),
      path: wi.relPath,
      status: wi.lifecycle,
      knowledge_level: wi.knowledgeLevel || undefined,
    })

    for (const glob of wi.codeGlobs) {
      const codeId = `code:${glob}`
      addNode({ id: codeId, type: 'code-glob', label: glob })
      addEdge(wiNodeId, codeId, 'owns')
    }
    for (const cap of wi.capabilities) {
      const capId = `capability:${slug(cap) || cap}`
      addNode({ id: capId, type: 'capability', label: cap })
      addEdge(wiNodeId, capId, 'implements')
    }
    for (const dec of wi.decisions) {
      const adrId = `adr:${dec}`
      addNode({ id: adrId, type: 'decision', label: dec })
      addEdge(wiNodeId, adrId, 'depends_on')
    }
    if (wi.initiative) {
      const initId = `initiative:${slug(wi.initiative) || wi.initiative}`
      addNode({ id: initId, type: 'initiative', label: wi.initiative })
      addEdge(wiNodeId, initId, 'belongs_to')
    }
    if (wi.source === 'roadmap' && wi.sourceId) {
      const candId = `candidate:${wi.sourceId}`
      addNode({ id: candId, type: 'roadmap-candidate', label: wi.sourceId })
      addEdge(candId, wiNodeId, 'materialized_as')
    }
  }

  // --- ADR nodes + governs edges. In `all` scope, include every ADR (even unreferenced);
  //     in `active` scope, only ADRs already referenced by a selected Work Item. ---
  for (const adr of all.filter(isAdr)) {
    const adrId = `adr:${adr.id || adr.title}`
    const referenced = nodes.has(adrId)
    if (scope === 'all' || referenced) {
      // Upgrade/insert with full metadata (a referenced node may only have a bare label so far).
      nodes.set(adrId, {
        id: adrId,
        type: 'decision',
        label: `${adr.id} ${adr.title}`.trim() || adr.id || adr.title,
        path: adr.relPath,
      })
      for (const glob of adr.codeGlobs) {
        const codeId = `code:${glob}`
        addNode({ id: codeId, type: 'code-glob', label: glob })
        addEdge(adrId, codeId, 'governs')
      }
    }
  }

  // --- Knowledge Capsules → project anchor (provides_external_context) ---
  const capsules = loadExternalRegistry(dir)
  if (capsules.length > 0) {
    const projId = `project:${slug(config.project.name) || 'project'}`
    addNode({ id: projId, type: 'project', label: config.project.name })
    for (const cap of capsules) {
      const capId = `capsule:${cap.id}`
      addNode({ id: capId, type: 'knowledge-capsule', label: cap.id, path: cap.path })
      addEdge(capId, projId, 'provides_external_context')
    }
  }

  return {
    generated_at: now.toISOString(),
    project: {
      name: config.project.name,
      state: config.project.state,
      structure: config.project.structure,
    },
    nodes: [...nodes.values()],
    edges,
  }
}

/** Edge types that represent a real relationship (everything except the layer `informs` chain). */
const RELATIONSHIP_EDGES = new Set<GraphEdgeType>([
  'belongs_to',
  'materialized_as',
  'owns',
  'implements',
  'depends_on',
  'governs',
  'provides_external_context',
])

/** True when the graph has nodes but no real relationship edges (only the layer chain / isolated). */
export function graphIsSparse(graph: KnowledgeGraph): boolean {
  return !graph.edges.some((e) => RELATIONSHIP_EDGES.has(e.type))
}

export function serializeGraphJson(graph: KnowledgeGraph): string {
  return JSON.stringify(graph, null, 2) + '\n'
}

/** Render the graph as a Mermaid `flowchart LR`. Node ids are sanitized + de-duplicated. */
export function renderGraphMermaid(graph: KnowledgeGraph): string {
  const safeIds = new Map<string, string>()
  const used = new Set<string>()
  const safe = (id: string): string => {
    const existing = safeIds.get(id)
    if (existing) return existing
    let base = id.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')
    if (!base) base = 'n'
    let candidate = base
    let i = 1
    while (used.has(candidate)) candidate = `${base}_${i++}`
    used.add(candidate)
    safeIds.set(id, candidate)
    return candidate
  }
  const escapeLabel = (s: string): string => s.replace(/"/g, "'")

  const lines = ['flowchart LR']
  for (const node of graph.nodes) {
    lines.push(`  ${safe(node.id)}["${escapeLabel(node.label)}"]`)
  }
  if (graph.edges.length > 0) lines.push('')
  for (const edge of graph.edges) {
    lines.push(`  ${safe(edge.from)} -->|${edge.type}| ${safe(edge.to)}`)
  }
  return lines.join('\n') + '\n'
}

// ---------------------------------------------------------------------------
// Summary for explain / context (read the exported graph; never generate it).
// ---------------------------------------------------------------------------

export type GraphSummary = {
  generatedAt: string
  nodes: number
  edges: number
  /** Active Work Items that own at least one code glob. */
  activeWorkItemsConnectedToCode: number
}

const ACTIVE_WI_STATES = new Set(['draft', 'ready', 'in-progress', 'blocked'])

/** Read `.kaddo/graph.json` if it exists and summarize it. Returns null when not exported. */
export function loadGraphSummary(dir: string): GraphSummary | null {
  const p = join(dir, '.kaddo', 'graph.json')
  if (!exists(p)) return null
  try {
    const graph = JSON.parse(readFile(p)) as KnowledgeGraph
    const nodes = Array.isArray(graph.nodes) ? graph.nodes : []
    const edges = Array.isArray(graph.edges) ? graph.edges : []
    const activeWiIds = new Set(
      nodes
        .filter((n) => n.type === 'work-item' && (!n.status || ACTIVE_WI_STATES.has(n.status)))
        .map((n) => n.id)
    )
    const connected = new Set(
      edges.filter((e) => e.type === 'owns' && activeWiIds.has(e.from)).map((e) => e.from)
    )
    return {
      generatedAt: String(graph.generated_at ?? ''),
      nodes: nodes.length,
      edges: edges.length,
      activeWorkItemsConnectedToCode: connected.size,
    }
  } catch {
    return null
  }
}
