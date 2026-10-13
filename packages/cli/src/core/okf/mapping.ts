// OKF mapping (WI-065): explicit, documented mapping from Kaddo artifacts to OKF concepts.
//
// The mapping is deliberate and conservative. OKF has no closed type taxonomy, so unknown Kaddo types
// pass through as readable generic concept types rather than being dropped. Domain state is NOT
// translated into OKF state (e.g. a completed Work Item is not an OKF "stable" concept). Provenance
// is the artifact's real canonical id and path — never invented.

import matter from 'gray-matter'
import { readFile } from '../../utils/fs.js'
import type { KnowledgeArtifact } from '../../services/knowledge-artifacts.js'
import type { OkfConcept } from './types.js'

/** Documented Kaddo → OKF concept-type table (§4 of the spec). */
export const OKF_TYPE_TABLE: Record<string, string> = {
  'business-knowledge': 'Business Knowledge',
  'product-knowledge': 'Product Knowledge',
  'technical-knowledge': 'Technical Knowledge',
  capability: 'Capability',
  decision: 'Architecture Decision',
  adr: 'Architecture Decision',
  'project-resource': 'Project Resource',
  'deprecation-plan': 'Deprecation Plan',
  initiative: 'Initiative',
  capsule: 'Knowledge Reference',
  'knowledge-capsule': 'Knowledge Reference',
  'current-state': 'Technical Knowledge',
  roadmap: 'Delivery Knowledge',
}

const WORK_ITEM_TYPES = new Set(['feature', 'bugfix', 'hotfix', 'spike', 'chore'])
const REPORT_TYPES = new Set(['impact-report', 'drift-report', 'savings-report', 'poc-report'])
/** Operational docs that instruct how to work WITH the system — not verified system knowledge. */
const AGENT_INSTRUCTION_TYPES = new Set(['agent', 'workflow', 'prompt', 'skill'])

/** Whether an artifact is an agent/workflow instruction rather than system knowledge (WI-066 P8). */
export function isAgentInstruction(a: KnowledgeArtifact): boolean {
  const t = (a.type || '').toLowerCase()
  if (AGENT_INSTRUCTION_TYPES.has(t)) return true
  const p = a.relPath.toLowerCase()
  return p.includes('/agents/') || p.includes('/skills/') || p.includes('/workflows/')
}

/** Resolve the OKF concept type for a discovered artifact. Readable fallback for unknown types. */
export function okfConceptType(a: KnowledgeArtifact): string {
  if (a.isWorkItem) return 'Work Item'
  const t = (a.type || '').toLowerCase()
  if (OKF_TYPE_TABLE[t]) return OKF_TYPE_TABLE[t]
  if (REPORT_TYPES.has(t)) return 'Report'
  if (WORK_ITEM_TYPES.has(t)) return 'Work Item'
  // Unknown type → generic, readable concept derived from the layer, then the raw type.
  if (a.layer === 'business') return 'Business Knowledge'
  if (a.layer === 'product') return 'Product Knowledge'
  if (a.layer === 'tech' || a.layer === 'module') return 'Technical Knowledge'
  if (a.layer === 'delivery') return 'Delivery Knowledge'
  return t ? t.replace(/(^|[-_ ])(\w)/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase()) : 'Knowledge'
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}
function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []
}

/** Bundle-relative path for a concept, mirroring the knowledge layers under stable, id-named files. */
export function conceptBundlePath(a: KnowledgeArtifact, id: string): string {
  const file = `${id}.md`
  if (a.isWorkItem) return `delivery/work-items/${file}`
  const t = (a.type || '').toLowerCase()
  if (isAgentInstruction(a)) return `agents/${file}`
  if (t === 'deprecation-plan') return `delivery/deprecations/${file}`
  if (t === 'production-runbook') return `delivery/runbooks/${file}`
  if (t === 'project-resource') return `resources/${file}`
  if (t === 'knowledge-capsule' || t === 'capsule') return `external/${file}`
  switch (a.layer) {
    case 'business': return `business/${file}`
    case 'product': return `product/${file}`
    case 'tech': return `tech/${file}`
    case 'module': return `tech/modules/${file}`
    case 'delivery': return `delivery/${file}`
    default: return `misc/${file}`
  }
}

/** Parse the related concept ids a Work Item declares (resources, deprecation targets, parent). */
function workItemRelations(fm: Record<string, unknown>): { id: string; role: string }[] {
  const out: { id: string; role: string }[] = []
  const resources = fm.resources
  if (Array.isArray(resources)) {
    for (const r of resources) {
      if (r && typeof r === 'object') {
        const id = str((r as Record<string, unknown>).id)
        if (id) out.push({ id, role: str((r as Record<string, unknown>).role) ?? 'uses' })
      }
    }
  }
  const dep = fm.deprecation_targets
  if (Array.isArray(dep)) {
    for (const d of dep) {
      const s = typeof d === 'string' ? d : (d && typeof d === 'object' ? str((d as Record<string, unknown>).plan) : null)
      if (s) out.push({ id: s.includes('/') ? s.split('/')[0] : s, role: 'deprecates-via' })
    }
  }
  const parent = str(fm.parent)
  if (parent) out.push({ id: parent, role: 'child-of' })
  for (const dId of strArray(fm.decisions)) out.push({ id: dId, role: 'decided-by' })
  return out
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

/** A stable concept id: the explicit canonical id, else a slug derived from title or source path. */
export function conceptId(a: KnowledgeArtifact): string {
  if (a.id) return a.id
  if (a.title) return slugify(a.title)
  const base = a.relPath.split('/').pop() ?? ''
  return slugify(base.replace(/\.md$/, '')) || slugify(a.relPath)
}

/**
 * Read the canonical Markdown body of an artifact (everything after its frontmatter), verbatim.
 * Returns null when the file cannot be read, so the concept is still exported as a reference.
 */
function readBody(a: KnowledgeArtifact): string | null {
  try {
    const body = matter(readFile(a.filePath)).content.trim()
    return body || null
  } catch {
    return null
  }
}

/** Build an OKF concept from a discovered artifact. Preserves the full canonical body; never fabricates. */
export function buildConcept(a: KnowledgeArtifact): OkfConcept | null {
  const id = conceptId(a)
  if (!id) return null
  const rawFm = a.rawFrontmatter ?? {}
  return {
    id,
    type: okfConceptType(a),
    title: a.title || id,
    description: str(a.summary),
    tags: a.domains.map((d) => String(d).toLowerCase()),
    path: conceptBundlePath(a, id),
    sourcePath: a.relPath,
    related: a.isWorkItem ? workItemRelations(rawFm) : [],
    // Preserve the canonical Markdown body so the concept is consumable, not just discoverable (WI-066 P1).
    body: readBody(a),
  }
}
