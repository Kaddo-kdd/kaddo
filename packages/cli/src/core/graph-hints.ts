// Graph Relationship Quality & Metadata Hints (VS-056).
//
// Builds non-blocking hints that help a user enrich the knowledge graph from VS-055. It detects
// artifacts with weak/incomplete relationships and suggests explicit front matter to declare —
// it NEVER infers semantic relationships, never edits artifacts, never reads `src/` and never
// calls an LLM. The graph is only as useful as the relationships declared in knowledge.

import { exists, readFile, join } from '../utils/fs.js'
import { discoverKnowledge, type KnowledgeArtifact } from '../services/knowledge-artifacts.js'
import { loadExternalRegistry } from './capsule.js'
import { isActiveState } from './lifecycle.js'
import type { KnowledgeGraph } from './graph.js'

const KNOWLEDGE = 'knowledge'

export type GraphQuality = 'good' | 'partial' | 'sparse' | 'empty'

export type GraphHint = {
  artifact_id: string
  artifact_type: 'work-item' | 'decision' | 'capability' | 'knowledge-capsule'
  path?: string
  severity: 'info'
  missing: string[]
  reason: string
  /** One-line summary for context/explain/understand. */
  message: string
  /** Array-valued front matter the user could add (placeholders, never invented values). */
  suggested_front_matter?: Record<string, string[]>
}

export type GraphMetrics = {
  nodes_count: number
  edges_count: number
  connected_nodes_count: number
  isolated_nodes_count: number
  active_work_items_without_code: number
  active_work_items_without_capabilities: number
  work_items_without_source: number
  adrs_without_code: number
  capsules_without_related_work_items: number
}

export type GraphHintsReport = {
  generated_at: string
  /** Scope of the graph these hints were computed from (VS-060). */
  scope: string
  scope_reason: string
  quality: GraphQuality
  summary: { nodes: number; edges: number; hints: number }
  metrics: GraphMetrics
  hints: GraphHint[]
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

/** `## `/`### ` heading titles from capabilities.md — the declared capabilities. */
function capabilityHeadings(dir: string): string[] {
  const p = join(dir, KNOWLEDGE, 'product', 'capabilities.md')
  if (!exists(p)) return []
  return readFile(p)
    .split(/\r?\n/)
    .map((l) => l.match(/^#{2,3}\s+(.+?)\s*$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => m[1].trim())
    .filter((h) => !/^(summary|resumen|overview|capabilities|capacidades)$/i.test(h))
}

function humanMissing(field: string): string {
  switch (field) {
    case 'code':
      return 'code ownership'
    case 'capabilities':
      return 'linked capability'
    case 'decisions':
      return 'linked decision'
    case 'source':
      return 'roadmap link'
    default:
      return field
  }
}

/**
 * Compute graph hints + quality from the project artifacts and the built graph. Deterministic:
 * reads only knowledge artifacts + the external registry.
 */
export function buildGraphHints(
  dir: string,
  graph: KnowledgeGraph,
  now: Date = new Date()
): GraphHintsReport {
  const artifacts = discoverKnowledge(dir)
  const workItems = artifacts.filter((a) => a.isWorkItem)
  const activeWIs = workItems.filter((a) => a.lifecycle && isActiveState(a.lifecycle))
  const adrs = artifacts.filter(isAdr)
  const capsules = loadExternalRegistry(dir)

  const hints: GraphHint[] = []

  // Capabilities referenced by any Work Item (by slug), for the "capability without WI" hint.
  const referencedCapabilitySlugs = new Set(
    workItems.flatMap((w) => w.capabilities.map((c) => slug(c)))
  )
  // Capsule ids referenced by any Work Item (`capsules:` front matter).
  const referencedCapsuleIds = new Set(workItems.flatMap((w) => w.capsules.map((c) => c)))

  // --- 1/2/5(per WI)/source: one hint per active Work Item with limited relationships ---
  let activeWithoutCode = 0
  let activeWithoutCapabilities = 0
  let wisWithoutSource = 0
  for (const wi of activeWIs) {
    const id = wi.id || wi.title
    const missing: string[] = []
    const suggested: Record<string, string[]> = {}
    if (wi.codeGlobs.length === 0) {
      missing.push('code')
      suggested.code = ['src/<area>/**']
      activeWithoutCode++
    }
    if (wi.capabilities.length === 0) {
      missing.push('capabilities')
      suggested.capabilities = ['<capability>']
      activeWithoutCapabilities++
    }
    if (wi.decisions.length === 0) {
      missing.push('decisions')
      suggested.decisions = ['ADR-XXX']
    }
    const hasSource = Boolean(wi.sourceId) || Boolean(wi.initiative)
    if (!hasSource) {
      missing.push('source')
      wisWithoutSource++
    }
    if (missing.length === 0) continue
    hints.push({
      artifact_id: id,
      artifact_type: 'work-item',
      path: wi.relPath,
      severity: 'info',
      missing,
      reason: 'Active Work Item has limited graph relationships.',
      message: `${id} has no ${missing.map(humanMissing).join(', ')}.`,
      suggested_front_matter: Object.keys(suggested).length > 0 ? suggested : undefined,
    })
  }

  // --- 4: ADR without governed code ---
  let adrsWithoutCode = 0
  for (const adr of adrs) {
    if (adr.codeGlobs.length > 0) continue
    adrsWithoutCode++
    const id = adr.id || adr.title
    hints.push({
      artifact_id: id,
      artifact_type: 'decision',
      path: adr.relPath,
      severity: 'info',
      missing: ['code'],
      reason: 'This ADR defines technical decisions but does not declare which paths it governs.',
      message: `${id} has no governed code paths.`,
      suggested_front_matter: { code: ['<path/to/code>'] },
    })
  }

  // --- 5: capability declared but no Work Item references it ---
  for (const cap of capabilityHeadings(dir)) {
    if (referencedCapabilitySlugs.has(slug(cap))) continue
    hints.push({
      artifact_id: cap,
      artifact_type: 'capability',
      severity: 'info',
      missing: ['work-item'],
      reason: 'This capability is declared but no Work Item references it yet.',
      message: `Capability "${cap}" is not linked to any Work Item.`,
    })
  }

  // --- 6: registered Knowledge Capsule not referenced by any Work Item ---
  let capsulesWithoutWi = 0
  for (const cap of capsules) {
    if (referencedCapsuleIds.has(cap.id)) continue
    capsulesWithoutWi++
    hints.push({
      artifact_id: cap.id,
      artifact_type: 'knowledge-capsule',
      path: cap.path,
      severity: 'info',
      missing: ['work-item'],
      reason: 'This Knowledge Capsule is available but no Work Item declares `capsules:` for it.',
      message: `Knowledge Capsule "${cap.id}" is not linked to any Work Item.`,
    })
  }

  // --- Connectivity metrics ---
  const inEdge = new Set<string>()
  for (const e of graph.edges) {
    inEdge.add(e.from)
    inEdge.add(e.to)
  }
  const nodes = graph.nodes.length
  const connected = graph.nodes.filter((n) => inEdge.has(n.id)).length
  const relationshipEdges = graph.edges.filter((e) => e.type !== 'informs').length

  const metrics: GraphMetrics = {
    nodes_count: nodes,
    edges_count: graph.edges.length,
    connected_nodes_count: connected,
    isolated_nodes_count: nodes - connected,
    active_work_items_without_code: activeWithoutCode,
    active_work_items_without_capabilities: activeWithoutCapabilities,
    work_items_without_source: wisWithoutSource,
    adrs_without_code: adrsWithoutCode,
    capsules_without_related_work_items: capsulesWithoutWi,
  }

  const quality = assessQuality(nodes, relationshipEdges, hints.length)

  return {
    generated_at: now.toISOString(),
    scope: graph.scope,
    scope_reason: graph.scope_reason,
    quality,
    summary: { nodes, edges: graph.edges.length, hints: hints.length },
    metrics,
    hints,
  }
}

function assessQuality(nodes: number, relationshipEdges: number, hintCount: number): GraphQuality {
  if (nodes === 0 || relationshipEdges === 0) return 'empty'
  if (relationshipEdges / nodes < 0.25) return 'sparse'
  if (hintCount > 0) return 'partial'
  return 'good'
}

const QUALITY_NOTE: Record<GraphQuality, string> = {
  good: 'Most active artifacts have meaningful relationships.',
  partial: 'Some active artifacts have missing relationship metadata.',
  sparse: 'The graph has many nodes but few meaningful edges.',
  empty: 'The graph has almost no relationships.',
}

function yamlBlock(fm: Record<string, string[]>): string[] {
  const lines = ['```yaml']
  for (const [k, vals] of Object.entries(fm)) {
    lines.push(`${k}:`)
    for (const v of vals) lines.push(`  - ${v}`)
  }
  lines.push('```')
  return lines
}

/** Render the human-readable hints file. */
export function renderGraphHintsMarkdown(report: GraphHintsReport): string {
  const lines: string[] = []
  lines.push('# Kaddo Graph Hints')
  lines.push('')
  lines.push('Generated by `kaddo graph export`. Suggestions only — Kaddo never edits your artifacts.')
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push(`- Scope: ${report.scope} — ${report.scope_reason}`)
  lines.push(`- Relationship quality: ${report.quality} — ${QUALITY_NOTE[report.quality]}`)
  lines.push(`- Nodes: ${report.summary.nodes}`)
  lines.push(`- Edges: ${report.summary.edges}`)
  lines.push(`- Hints: ${report.summary.hints}`)
  lines.push('')

  if (report.hints.length === 0) {
    if (report.quality === 'empty') {
      lines.push('No active relationship hints were generated.')
      lines.push('')
      lines.push(`The graph is ${report.quality} for the **${report.scope}** scope — ${report.scope_reason}`)
      if (report.scope !== 'all') {
        lines.push('Run `kaddo graph export --scope all` to inspect completed Work Items and historical relationships.')
      }
    } else {
      lines.push('No hints — the declared relationships look healthy. 🎉')
    }
    lines.push('')
    return lines.join('\n')
  }

  lines.push('## Hints')
  lines.push('')
  for (const h of report.hints) {
    lines.push(`### ${h.artifact_id}${h.path ? ` — \`${h.path}\`` : ''}`)
    lines.push('')
    lines.push('Missing metadata:')
    lines.push('')
    for (const m of h.missing) lines.push(`- \`${m}\``)
    lines.push('')
    if (h.suggested_front_matter) {
      lines.push('Suggested front matter:')
      lines.push('')
      lines.push(...yamlBlock(h.suggested_front_matter))
      lines.push('')
    }
    lines.push(`Reason: ${h.reason}`)
    lines.push('')
  }
  lines.push('> Use the `graph-agent` to turn these hints into precise front matter — you confirm and apply.')
  lines.push('')
  return lines.join('\n')
}

export function serializeGraphHintsJson(report: GraphHintsReport): string {
  return JSON.stringify(report, null, 2) + '\n'
}

// ---------------------------------------------------------------------------
// Summary for explain / context / understand (read the exported hints file).
// ---------------------------------------------------------------------------

export type GraphHintsSummary = {
  scope: string
  scopeReason: string
  quality: GraphQuality
  totalHints: number
  /** Hints affecting active Work Items (drives the understand recommendation). */
  activeWorkItemHints: number
  /** Up to a few one-line hint messages for compact display. */
  messages: string[]
}

/** Read `.kaddo/graph-hints.json` if present and summarize it. Returns null when not exported. */
export function loadGraphHints(dir: string): GraphHintsSummary | null {
  const p = join(dir, '.kaddo', 'graph-hints.json')
  if (!exists(p)) return null
  try {
    const report = JSON.parse(readFile(p)) as GraphHintsReport
    const hints = Array.isArray(report.hints) ? report.hints : []
    return {
      scope: String(report.scope ?? 'active'),
      scopeReason: String(report.scope_reason ?? ''),
      quality: report.quality ?? 'empty',
      totalHints: hints.length,
      activeWorkItemHints: hints.filter((h) => h.artifact_type === 'work-item').length,
      messages: hints.map((h) => h.message).filter(Boolean),
    }
  } catch {
    return null
  }
}
