// Project Resource mutation contract (WI-036) — the single, deterministic source of create/update/
// delete rules for Project Resources. CLI, MCP and Admin all converge here; none writes Markdown on
// its own. Markdown under knowledge/tech/resources/ stays the source of truth. No network, no
// execution, never stores or resolves credential values.

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { readFile, exists, join, cwd, ensureDir } from '../utils/fs.js'
import { discoverKnowledge, discoverWorkItems } from '../services/knowledge-artifacts.js'
import { loadMappedModules } from '../services/mapped-modules.js'
import {
  getResource,
  parseWorkItemResources,
  RESOURCE_ARTIFACT_TYPE,
  RESOURCE_TYPES,
  INTERFACE_TYPES,
  type ResourceDetail,
} from './resources.js'

const RESOURCES_DIR = 'knowledge/tech/resources'

export type AccessInterfaceInput = {
  type: string
  tool?: string
  provider?: string
  purpose?: string
  operations?: string[]
  environments?: string[]
  constraints?: string
}

export type ResourceInput = {
  /** Required on create (used for the id when none is given). */
  title?: string
  resourceType?: string
  provider?: string
  environments?: string[]
  scope?: { type: string; module?: string | null }
  modules?: string[]
  purpose?: string
  accessInterfaces?: AccessInterfaceInput[]
  accessBoundaries?: Record<string, string[]>
  authentication?: { mode?: string; refs?: string[] }
  /** Optional explicit id on create (otherwise derived from the title). */
  id?: string
}

export type ResourceFinding = { level: 'error' | 'warning'; message: string }
export type ResourceReference = { kind: 'work-item'; id: string; role: string; path: string }

export type ResourceWriteResult = { id: string; path: string; findings: ResourceFinding[] }
export type ResourceDeletePreview = { id: string; references: ResourceReference[] }

export class ResourceWriteError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'ResourceWriteError'
  }
}

function slug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

function atomicWrite(filePath: string, content: string): void {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`
  fs.writeFileSync(tmp, content, 'utf-8')
  fs.renameSync(tmp, filePath)
}

/** Drop any auth ref that looks like a VALUE (NAME=value or non-identifier) — only names survive. */
function sanitizeRefs(refs: unknown): string[] {
  if (!Array.isArray(refs)) return []
  return refs
    .map((r) => String(r).trim())
    .filter((r) => r && !r.includes('=') && /^[A-Za-z0-9_.-]+$/.test(r))
}

function allResourceArtifacts(dir: string) {
  return discoverKnowledge(dir).filter((a) => a.type === RESOURCE_ARTIFACT_TYPE)
}

function nextResourceId(dir: string, title: string, explicit?: string): string {
  const existing = new Set(allResourceArtifacts(dir).map((a) => (a.id || '').toUpperCase()))
  if (explicit && explicit.trim()) return explicit.trim()
  const base = `RES-${slug(title) || 'resource'}`
  if (!existing.has(base.toUpperCase())) return base
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`
    if (!existing.has(candidate.toUpperCase())) return candidate
  }
  throw new ResourceWriteError('ID_EXHAUSTED', `Could not derive a unique id for "${title}".`)
}

/** Validate a resource against the contract + mapped modules. Findings are advisory unless noted. */
export function validateResource(dir: string, input: ResourceInput): ResourceFinding[] {
  const findings: ResourceFinding[] = []
  if (input.resourceType && !RESOURCE_TYPES.includes(input.resourceType as (typeof RESOURCE_TYPES)[number])) {
    findings.push({ level: 'warning', message: `Unknown resource_type "${input.resourceType}" (not in the known set).` })
  }
  for (const i of input.accessInterfaces ?? []) {
    if (i.type && !INTERFACE_TYPES.includes(i.type as (typeof INTERFACE_TYPES)[number])) {
      findings.push({ level: 'warning', message: `Unknown access interface type "${i.type}".` })
    }
  }
  // Module validation against .kaddo/modules.yml when available (no remote access).
  const mapped = loadMappedModules(dir).map((m) => m.id)
  if (mapped.length > 0) {
    const refs = new Set<string>()
    if (input.scope?.type === 'module' && input.scope.module) refs.add(input.scope.module)
    for (const m of input.modules ?? []) refs.add(m)
    for (const m of refs) {
      if (!mapped.includes(m)) findings.push({ level: 'warning', message: `Module "${m}" is not in .kaddo/modules.yml.` })
    }
  }
  if (input.scope && input.scope.type === 'module' && !input.scope.module) {
    findings.push({ level: 'error', message: 'scope.type "module" requires a module id.' })
  }
  return findings
}

/** Build the canonical frontmatter object for a resource (secret-safe). */
function buildFrontmatter(id: string, input: ResourceInput, base: Record<string, unknown> = {}): Record<string, unknown> {
  const data: Record<string, unknown> = { ...base }
  data.type = RESOURCE_ARTIFACT_TYPE
  data.id = id
  if (input.title != null) data.title = input.title
  if (input.resourceType != null) data.resource_type = input.resourceType
  if (input.provider != null) data.provider = input.provider
  if (input.environments != null) data.environments = input.environments
  if (input.scope != null) data.scope = input.scope.module ? { type: input.scope.type, module: input.scope.module } : { type: input.scope.type }
  if (input.modules != null) data.modules = input.modules
  if (input.accessInterfaces != null) data.access_interfaces = input.accessInterfaces
  if (input.accessBoundaries != null) data.access_boundaries = input.accessBoundaries
  if (input.authentication != null) {
    const mode = input.authentication.mode
    const refs = sanitizeRefs(input.authentication.refs)
    data.authentication = { ...(mode ? { mode } : {}), ...(refs.length ? { refs } : {}) }
  }
  return data
}

function serialize(data: Record<string, unknown>, body: string): string {
  return matter.stringify(`\n${body.trim()}\n`, data)
}

/** Create a new Project Resource. Returns its id/path and any advisory findings. */
export function createResource(dir: string, input: ResourceInput): ResourceWriteResult {
  const title = (input.title ?? '').trim()
  if (!title) throw new ResourceWriteError('INVALID_INPUT', 'A resource title is required.')
  const resourceType = (input.resourceType ?? '').trim()
  if (!resourceType) throw new ResourceWriteError('INVALID_INPUT', 'A resource_type is required.')

  const findings = validateResource(dir, input)
  if (findings.some((f) => f.level === 'error')) {
    throw new ResourceWriteError('VALIDATION_FAILED', findings.filter((f) => f.level === 'error').map((f) => f.message).join('; '))
  }

  // Duplicate detection (id + title).
  const existing = allResourceArtifacts(dir)
  if (input.id && existing.some((a) => (a.id || '').toUpperCase() === input.id!.toUpperCase())) {
    throw new ResourceWriteError('DUPLICATE', `A resource with id "${input.id}" already exists.`)
  }
  if (existing.some((a) => (a.title || '').toLowerCase() === title.toLowerCase())) {
    throw new ResourceWriteError('DUPLICATE', `A resource titled "${title}" already exists.`)
  }

  const id = nextResourceId(dir, title, input.id)
  const data = buildFrontmatter(id, input)
  const body = `# Purpose\n\n${(input.purpose ?? '').trim() || 'TODO: describe what this resource is for.'}`
  const relPath = `${RESOURCES_DIR}/${slug(title) || slug(id)}.md`
  const filePath = join(dir, relPath)
  if (exists(filePath)) throw new ResourceWriteError('DUPLICATE', `Resource file already exists: ${relPath}`)
  ensureDir(path.dirname(filePath))
  atomicWrite(filePath, serialize(data, body))
  return { id, path: relPath, findings }
}

/** Update an existing resource, preserving unknown frontmatter keys and the Markdown body (no-lossy). */
export function updateResource(dir: string, id: string, input: ResourceInput): ResourceWriteResult {
  const match = allResourceArtifacts(dir).find((a) => a.id === id || a.title === id)
  if (!match) throw new ResourceWriteError('NOT_FOUND', `Project Resource "${id}" not found.`)

  const findings = validateResource(dir, input)
  if (findings.some((f) => f.level === 'error')) {
    throw new ResourceWriteError('VALIDATION_FAILED', findings.filter((f) => f.level === 'error').map((f) => f.message).join('; '))
  }

  const raw = readFile(match.filePath)
  const parsed = matter(raw)
  const base = (parsed.data ?? {}) as Record<string, unknown>
  const data = buildFrontmatter(match.id || id, input, base)
  // Body: replace the Purpose only when a new purpose is given; otherwise keep the existing body.
  let body = parsed.content.trim()
  if (input.purpose != null) {
    const purpose = `# Purpose\n\n${input.purpose.trim()}`
    body = /^#\s+Purpose/m.test(body) ? body.replace(/#\s+Purpose[\s\S]*?(?=\n#\s|\n*$)/, purpose + '\n') : `${purpose}\n\n${body}`.trim()
  }
  atomicWrite(match.filePath, serialize(data, body))
  return { id: match.id || id, path: match.relPath, findings }
}

/** Work Items (and later modules) that reference a resource — used before deletion. */
export function getResourceReferences(dir: string, id: string): ResourceReference[] {
  const refs: ResourceReference[] = []
  for (const wi of discoverWorkItems(dir)) {
    for (const rel of parseWorkItemResources(wi.rawFrontmatter)) {
      if (rel.id === id) refs.push({ kind: 'work-item', id: wi.id || wi.title, role: rel.role, path: wi.relPath })
    }
  }
  return refs
}

/**
 * Delete a resource. Without `confirm`, returns a preview of references and writes nothing. With
 * `confirm: true`, removes ONLY the resource artifact — never the references in other artifacts.
 */
export function deleteResource(
  dir: string,
  id: string,
  opts: { confirm?: boolean } = {},
): { deleted: boolean; preview?: ResourceDeletePreview; path?: string } {
  const match = allResourceArtifacts(dir).find((a) => a.id === id || a.title === id)
  if (!match) throw new ResourceWriteError('NOT_FOUND', `Project Resource "${id}" not found.`)
  const references = getResourceReferences(dir, match.id || id)
  if (!opts.confirm) {
    return { deleted: false, preview: { id: match.id || id, references } }
  }
  fs.rmSync(match.filePath, { force: true })
  return { deleted: true, path: match.relPath }
}

export type { ResourceDetail }
