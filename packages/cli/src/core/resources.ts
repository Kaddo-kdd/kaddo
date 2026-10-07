// Project Resources (WI-030) — external systems the product uses (Supabase, PostgreSQL, AWS, Kafka,
// APIs…), modeled as first-class Tech Knowledge under knowledge/tech/resources/.
//
// A Resource is the stable system. CLI/MCP/SQL/API are ACCESS INTERFACES to it, not resources. This
// is read-only knowledge: it never connects to the system and never stores or resolves credential
// values — only references (an env var name, a secret reference). Discovery is deterministic.

import matter from 'gray-matter'
import { readFile } from '../utils/fs.js'
import { discoverKnowledge } from '../services/knowledge-artifacts.js'

export const RESOURCE_ARTIFACT_TYPE = 'project-resource'

// Minimal, extensible classifications. Validation is lax (unknown values pass through) so the schema
// can grow without a release — a single Resource Contract for every provider.
export const RESOURCE_TYPES = [
  'database', 'cloud', 'api', 'queue', 'storage', 'repository', 'platform', 'service', 'other',
] as const
export const INTERFACE_TYPES = ['cli', 'mcp', 'api', 'sql', 'sdk', 'iac', 'console', 'other'] as const
export const RESOURCE_ROLES = ['affected', 'implementation', 'validation', 'delivery'] as const

export type ResourceRole = (typeof RESOURCE_ROLES)[number]

/** How a Work Item relates to a Resource. Parsed from the WI front matter `resources:` list. */
export type WorkItemResource = { id: string; role: string }

export type AccessInterface = {
  type: string
  tool: string | null
  provider: string | null
  purpose: string | null
  operations: string[]
  environments: string[]
  constraints: string | null
}

/** Ownership/scope of a resource in a multirepo system (WI-036). Distinct from module dependency. */
export type ResourceScope = { type: string; module: string | null }

export type ResourceSummary = {
  id: string
  title: string
  resourceType: string | null
  provider: string | null
  environments: string[]
  /** Ownership scope: system, or module/<id>. Null when not declared (defaults to system-ish). */
  scope: ResourceScope | null
  /** Modules that use this resource (dependency, not ownership). */
  modules: string[]
  /** POSIX path relative to the project root. */
  path: string
}

export type ResourceDetail = ResourceSummary & {
  purpose: string | null
  interfaces: AccessInterface[]
  /** Access boundaries by environment (e.g. { production: ["read"] }), when declared. */
  boundaries: Record<string, string[]>
  /**
   * Authentication REFERENCES only (env var / secret names), never values. e.g. SUPABASE_ACCESS_TOKEN.
   */
  authRefs: string[]
  authMode: string | null
  /** The canonical Markdown body (verbatim), for faithful human display. */
  markdownBody: string
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function strArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  if (typeof v === 'string' && v.trim()) return [v.trim()]
  return []
}

function parseInterfaces(v: unknown): AccessInterface[] {
  if (!Array.isArray(v)) return []
  const out: AccessInterface[] = []
  for (const raw of v) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const type = str(o.type)
    if (!type) continue
    out.push({
      type,
      tool: str(o.tool),
      provider: str(o.provider),
      purpose: str(o.purpose),
      operations: strArray(o.operations),
      environments: strArray(o.environments),
      constraints: str(o.constraints),
    })
  }
  return out
}

function parseBoundaries(v: unknown): Record<string, string[]> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const out: Record<string, string[]> = {}
  for (const [env, val] of Object.entries(v as Record<string, unknown>)) {
    const list = strArray(val)
    if (list.length > 0) out[env] = list
  }
  return out
}

/**
 * Authentication references, never values. Reads `authentication: { mode, refs: [...] }`. Any value
 * that looks like a secret (contains `=` or is long/opaque) is dropped defensively — only names pass.
 */
function parseAuth(v: unknown): { mode: string | null; refs: string[] } {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return { mode: null, refs: [] }
  const o = v as Record<string, unknown>
  const refs = strArray(o.refs).filter((r) => !r.includes('=') && /^[A-Za-z0-9_.-]+$/.test(r))
  return { mode: str(o.mode), refs }
}

/** Parse `scope: { type, module }`. Returns null when absent. */
export function parseScope(v: unknown): ResourceScope | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const o = v as Record<string, unknown>
  const type = str(o.type)
  if (!type) return null
  return { type, module: str(o.module) }
}

/** The text under a `# Purpose` / `## Purpose` heading in the body, if present. */
function purposeFromBody(body: string): string | null {
  const m = body.match(/^#{1,2}\s+Purpose\s*\n+([\s\S]*?)(?=\n#{1,2}\s|\s*$)/m)
  const text = m ? m[1].trim() : ''
  return text || null
}

function toDetail(filePath: string, relPath: string, raw: string): ResourceDetail {
  const parsed = matter(raw)
  const fm = (parsed.data ?? {}) as Record<string, unknown>
  const body = parsed.content.trim()
  const id = str(fm.id) ?? ''
  return {
    id,
    title: str(fm.title) ?? id,
    resourceType: str(fm.resource_type),
    provider: str(fm.provider),
    environments: strArray(fm.environments),
    scope: parseScope(fm.scope),
    modules: strArray(fm.modules),
    path: relPath,
    purpose: str(fm.purpose) ?? purposeFromBody(body),
    interfaces: parseInterfaces(fm.access_interfaces),
    boundaries: parseBoundaries(fm.access_boundaries),
    ...(() => {
      const a = parseAuth(fm.authentication)
      return { authRefs: a.refs, authMode: a.mode }
    })(),
    markdownBody: body,
  }
}

/** All Project Resources (type: project-resource) under knowledge/tech/resources/. */
export function getResources(dir: string): ResourceSummary[] {
  return discoverKnowledge(dir)
    .filter((a) => a.type === RESOURCE_ARTIFACT_TYPE)
    .map((a) => {
      const fm = a.rawFrontmatter
      return {
        id: a.id || str(fm.id) || a.title,
        title: a.title || str(fm.title) || a.id,
        resourceType: str(fm.resource_type),
        provider: str(fm.provider),
        environments: strArray(fm.environments),
        scope: parseScope(fm.scope),
        modules: strArray(fm.modules),
        path: a.relPath,
      }
    })
    .sort((x, y) => x.id.localeCompare(y.id))
}

/** One Project Resource by id, with interfaces, boundaries and auth references (never values). */
export function getResource(dir: string, id: string): ResourceDetail | null {
  const match = discoverKnowledge(dir).find(
    (a) => a.type === RESOURCE_ARTIFACT_TYPE && (a.id === id || a.title === id),
  )
  if (!match) return null
  const raw = readFile(match.filePath)
  return toDetail(match.filePath, match.relPath, raw)
}

/** Parse a Work Item's `resources:` front matter into id/role pairs. Separate from affected_modules. */
export function parseWorkItemResources(fm: Record<string, unknown>): WorkItemResource[] {
  const v = fm.resources
  if (!Array.isArray(v)) return []
  const out: WorkItemResource[] = []
  for (const raw of v) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const o = raw as Record<string, unknown>
    const id = str(o.id)
    if (!id) continue
    out.push({ id, role: str(o.role) ?? 'affected' })
  }
  return out
}
