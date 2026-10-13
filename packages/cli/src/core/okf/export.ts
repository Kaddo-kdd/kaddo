// OKF export (WI-065 + WI-066): project Kaddo's canonical knowledge into a portable OKF v0.2 bundle.
//
// Read-only over existing Core readers. Deterministic for a given logical snapshot (concepts and files
// are id-sorted). Never modifies source artifacts. Preserves full Markdown bodies, resolves internal
// links into the bundle, follows OKF index conventions (no frontmatter on indexes except okf_version on
// the root), detects identity collisions, keeps sensitive content out, and publishes atomically via a
// staging directory so a failed export never destroys a prior valid bundle.

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { discoverKnowledge } from '../../services/knowledge-artifacts.js'
import { buildConcept, isAgentInstruction } from './mapping.js'
import { reportConcepts, externalCapsuleConcepts } from './extras.js'
import { OKF_VERSION, OkfExportError, type OkfConcept, type OkfExportResult } from './types.js'

export const OKF_DEFAULT_OUTPUT = '.kaddo/okf'

function frontmatter(data: Record<string, unknown>): string {
  const lines: string[] = ['---']
  for (const [k, v] of Object.entries(data)) {
    if (v == null) continue
    if (Array.isArray(v)) {
      if (v.length === 0) continue
      lines.push(`${k}:`)
      for (const item of v) {
        if (item && typeof item === 'object') {
          const entries = Object.entries(item as Record<string, unknown>).filter(([, x]) => x != null)
          if (entries.length === 0) continue
          lines.push(`  - ${entries.map(([ik, iv]) => `${ik}: ${JSON.stringify(iv)}`).join('\n    ')}`)
        } else {
          lines.push(`  - ${JSON.stringify(item)}`)
        }
      }
    } else if (v && typeof v === 'object') {
      lines.push(`${k}:`)
      for (const [ik, iv] of Object.entries(v as Record<string, unknown>)) {
        if (iv != null) lines.push(`  ${ik}: ${JSON.stringify(iv)}`)
      }
    } else {
      lines.push(`${k}: ${JSON.stringify(v)}`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}

/** Relative link from one bundle file to another (POSIX, for portable Markdown). */
function relLink(fromPath: string, toPath: string): string {
  const rel = path.posix.relative(path.posix.dirname(fromPath), toPath)
  return rel.startsWith('.') ? rel : `./${rel}`
}

/**
 * Rewrite internal Markdown links in a canonical body that point at another exported artifact, so they
 * resolve inside the bundle. Only unambiguous source→bundle matches are rewritten; external links and
 * unresolved references are left untouched (validation reports the latter as informational).
 */
function rewriteBodyLinks(body: string, sourcePath: string, srcToBundle: Map<string, string>, selfBundlePath: string): string {
  const srcDir = path.posix.dirname(sourcePath)
  return body.replace(/\]\(([^)]+)\)/g, (whole, href: string) => {
    const raw = href.trim()
    const bare = raw.split('#')[0].split(' ')[0]
    if (!bare || /^(https?:|mailto:|#)/.test(bare)) return whole
    const candidate = bare.startsWith('/')
      ? bare.replace(/^\/+/, '')
      : path.posix.normalize(path.posix.join(srcDir, bare))
    const target = srcToBundle.get(candidate)
    if (!target) return whole
    const anchor = raw.includes('#') ? '#' + raw.split('#').slice(1).join('#') : ''
    return `](${relLink(selfBundlePath, target)}${anchor})`
  })
}

function renderConcept(c: OkfConcept, byId: Map<string, OkfConcept>, srcToBundle: Map<string, string>): string {
  const data: Record<string, unknown> = {
    type: c.type,
    title: c.title,
    description: c.description,
    tags: c.tags,
    kaddo_id: c.id,
  }
  // Provenance: a real source path, or `generated` (by+at) for generated concepts. Never both-faked.
  if (c.sourcePath) data.sources = [{ resource: c.sourcePath }]
  if (c.generatedBy || c.generatedAt) {
    data.generated = { ...(c.generatedBy ? { by: c.generatedBy } : {}), ...(c.generatedAt ? { at: c.generatedAt } : {}) }
  }

  const parts = [frontmatter(data)]
  if (c.body) {
    const body = c.sourcePath ? rewriteBodyLinks(c.body, c.sourcePath, srcToBundle, c.path) : c.body
    parts.push('', body.trim())
  } else {
    parts.push('', `# ${c.title}`)
    if (c.description) parts.push('', c.description)
  }
  const resolved = c.related.filter((r) => byId.has(r.id))
  if (resolved.length > 0) {
    parts.push('', '## Related')
    for (const r of resolved) {
      const target = byId.get(r.id)!
      parts.push(`- [${target.title}](${relLink(c.path, target.path)}) — ${r.role}`)
    }
  }
  return parts.join('\n') + '\n'
}

/** Render an index. Per OKF v0.2 only the root index carries frontmatter (just okf_version); nested
 * indexes have none. `childDirs` link to sub-collection indexes for progressive disclosure. */
function renderIndex(title: string, concepts: OkfConcept[], childDirs: string[], fromPath: string, root: boolean): string {
  const parts: string[] = []
  if (root) parts.push(frontmatter({ okf_version: OKF_VERSION }), '')
  parts.push(`# ${title}`, '')
  if (root) parts.push('Open Knowledge Format bundle — a portable projection of Kaddo knowledge.',
    'Kaddo remains the source of truth.', '')
  if (childDirs.length > 0) {
    parts.push('## Sections')
    // childDirs are full bundle paths (e.g. "delivery/work-items"); link to each child's own index.
    for (const d of [...childDirs].sort()) parts.push(`- [${d.split('/').pop()}/](${relLink(fromPath, `${d}/index.md`)})`)
    parts.push('')
  }
  const byType = new Map<string, OkfConcept[]>()
  for (const c of concepts) { const l = byType.get(c.type) ?? []; l.push(c); byType.set(c.type, l) }
  for (const type of [...byType.keys()].sort()) {
    parts.push(`## ${type}`)
    for (const c of byType.get(type)!.sort((a, b) => a.id.localeCompare(b.id))) {
      const d = c.description ? ` — ${c.description}` : ''
      parts.push(`- [${c.title}](${relLink(fromPath, c.path)})${d}`)
    }
    parts.push('')
  }
  return parts.join('\n')
}

// High-signal secret patterns (safety backstop; the policy is to NOT persist a matching concept).
const SENSITIVE_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, label: 'private key block' },
  { re: /\bAKIA[0-9A-Z]{16}\b/, label: 'AWS access key id' },
  { re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/, label: 'GitHub token' },
  { re: /\b(?:password|secret|api[_-]?key|access[_-]?token)\b\s*[:=]\s*["']?[A-Za-z0-9+/_\-]{12,}/i, label: 'inline credential' },
]
function sensitiveLabels(content: string): string[] {
  return [...new Set(SENSITIVE_PATTERNS.filter((p) => p.re.test(content)).map((p) => p.label))]
}

/** Reject destinations that could destroy project data (WI-066 P4). Throws before any write. */
function assertSafeDestination(dir: string, outputDir: string): void {
  const root = path.resolve(dir)
  const out = path.resolve(outputDir)
  const within = (child: string, parent: string) => {
    const rel = path.relative(parent, child)
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
  }
  if (out === root) throw new OkfExportError('UNSAFE_DESTINATION', 'Refusing to export onto the project root.')
  if (within(root, out)) throw new OkfExportError('UNSAFE_DESTINATION', 'Refusing to export onto a parent of the project.')
  for (const protectedDir of ['knowledge', 'packages', 'apps', 'src', 'node_modules', '.git']) {
    const p = path.join(root, protectedDir)
    if (out === p || within(out, p)) throw new OkfExportError('UNSAFE_DESTINATION', `Refusing to export into a protected directory: ${protectedDir}/`)
  }
  // Do not clobber a non-empty directory that is not already an OKF bundle.
  if (fs.existsSync(out)) {
    try {
      const entries = fs.readdirSync(out)
      const looksOkf = entries.includes('index.md') && /okf_version/.test(fs.readFileSync(path.join(out, 'index.md'), 'utf-8'))
      if (entries.length > 0 && !looksOkf) {
        throw new OkfExportError('UNSAFE_DESTINATION', `Destination is not empty and is not an OKF bundle: ${outputDir}. Use an empty or dedicated directory.`)
      }
    } catch (e) { if (e instanceof OkfExportError) throw e }
  }
}

/** Detect unresolved identity collisions (same id or destination path from different sources). */
function detectCollisions(concepts: { id: string; path: string; sourcePath: string | null }[]): string[] {
  const byId = new Map<string, string>()
  const byPath = new Map<string, string>()
  const errors: string[] = []
  for (const c of concepts) {
    const prev = byId.get(c.id)
    if (prev && prev !== (c.sourcePath ?? '')) errors.push(`Concept id "${c.id}" is produced by two different sources: ${prev} and ${c.sourcePath}.`)
    else byId.set(c.id, c.sourcePath ?? '')
    const prevP = byPath.get(c.path)
    if (prevP && prevP !== c.id) errors.push(`Destination path "${c.path}" is claimed by two concepts: ${prevP} and ${c.id}.`)
    else byPath.set(c.path, c.id)
  }
  return errors
}

export function exportOkf(dir: string, opts: { output?: string; withReports?: boolean; withAgents?: boolean; now?: Date } = {}): OkfExportResult {
  const outRel = opts.output ?? OKF_DEFAULT_OUTPUT
  const outputDir = path.isAbsolute(outRel) ? outRel : path.join(dir, outRel)
  assertSafeDestination(dir, outputDir)

  const extraWarnings: string[] = []

  // --- 1. Discovery + eligibility ---
  const artifacts = discoverKnowledge(dir)
  const raw: OkfConcept[] = []
  const omittedCounts = new Map<string, number>()
  const omittedConcepts: { id: string; reason: string }[] = []
  const bump = (type: string) => omittedCounts.set(type, (omittedCounts.get(type) ?? 0) + 1)

  const sameSource = new Set<string>()
  for (const a of artifacts) {
    // Agent/workflow instructions are not verified system knowledge — excluded unless explicitly included.
    if (isAgentInstruction(a) && !opts.withAgents) { bump(a.type || 'agent'); continue }
    const c = buildConcept(a)
    if (!c) { bump(a.type || 'unknown'); continue }
    const key = `${c.id}\u0000${c.sourcePath ?? ''}`
    if (sameSource.has(key)) continue // identical re-discovery of the same file
    sameSource.add(key)
    raw.push(c)
  }
  for (const c of externalCapsuleConcepts(dir)) raw.push(c)
  if (opts.withReports) {
    const { concepts: reports, warnings } = reportConcepts(dir, opts.now ?? new Date())
    raw.push(...reports)
    extraWarnings.push(...warnings)
  }

  // --- 2. Identity collisions (before writing anything) ---
  const collisions = detectCollisions(raw)
  if (collisions.length > 0) {
    throw new OkfExportError('IDENTITY_COLLISION', `Cannot export: ${collisions.length} unresolved identity collision(s):\n- ${collisions.join('\n- ')}`)
  }

  // --- 3. Sensitive content: omit matching concepts BEFORE persisting (never log the value) ---
  const concepts: OkfConcept[] = []
  for (const c of raw) {
    const hay = `${c.title}\n${c.description ?? ''}\n${c.body ?? ''}`
    const labels = sensitiveLabels(hay)
    if (labels.length > 0) { omittedConcepts.push({ id: c.id, reason: `potential ${labels.join(', ')}` }); continue }
    concepts.push(c)
  }
  concepts.sort((a, b) => a.id.localeCompare(b.id))
  const byId = new Map(concepts.map((c) => [c.id, c]))
  const srcToBundle = new Map<string, string>()
  for (const c of concepts) if (c.sourcePath) srcToBundle.set(c.sourcePath, c.path)

  // --- 4. Serialize into an in-memory file set ---
  const files = new Map<string, string>()
  for (const c of concepts) files.set(c.path, renderConcept(c, byId, srcToBundle))

  // Nested indexes: one per directory that contains concepts (progressive disclosure).
  const dirs = new Map<string, OkfConcept[]>()
  const childDirs = new Map<string, Set<string>>()
  for (const c of concepts) {
    const d = path.posix.dirname(c.path)
    ;(dirs.get(d) ?? dirs.set(d, []).get(d)!).push(c)
    // register this dir under each of its ancestors as a child collection
    const segs = d === '.' ? [] : d.split('/')
    for (let i = 0; i < segs.length; i++) {
      const parent = segs.slice(0, i).join('/') || '.'
      const child = segs.slice(0, i + 1).join('/')
      ;(childDirs.get(parent) ?? childDirs.set(parent, new Set()).get(parent)!).add(child)
    }
  }
  // Every directory with concepts OR child collections gets an index — including intermediate dirs
  // (e.g. delivery/) that only hold sub-collections, so navigation is unbroken from root to leaf.
  let indexCount = 0
  const allDirs = new Set<string>([...dirs.keys(), ...childDirs.keys()])
  for (const d of allDirs) {
    if (d === '.') continue // root handled below
    const title = d.split('/').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ')
    const kids = [...(childDirs.get(d) ?? [])] // full bundle paths of child collections
    files.set(`${d}/index.md`, renderIndex(title, dirs.get(d) ?? [], kids, `${d}/index.md`, false))
    indexCount++
  }
  // Root index
  const rootConcepts = dirs.get('.') ?? []
  const rootKids = [...(childDirs.get('.') ?? [])]
  files.set('index.md', renderIndex('Knowledge bundle', rootConcepts, rootKids, 'index.md', true))
  indexCount++

  // --- 5. Publish atomically via staging; a failure never destroys a prior valid bundle ---
  const staging = `${outputDir}.staging-${process.pid}-${Date.now()}`
  try {
    fs.rmSync(staging, { recursive: true, force: true })
    for (const [rel, content] of files) {
      const full = path.join(staging, rel)
      fs.mkdirSync(path.dirname(full), { recursive: true })
      fs.writeFileSync(full, content, 'utf-8')
    }
    const backup = `${outputDir}.old-${process.pid}-${Date.now()}`
    if (fs.existsSync(outputDir)) fs.renameSync(outputDir, backup)
    try {
      fs.renameSync(staging, outputDir)
    } catch (e) {
      if (fs.existsSync(backup)) fs.renameSync(backup, outputDir) // restore prior bundle
      throw e
    }
    fs.rmSync(backup, { recursive: true, force: true })
  } finally {
    fs.rmSync(staging, { recursive: true, force: true })
  }

  const written = [...files.keys()].sort()
  return {
    outputDir,
    conceptCount: concepts.length,
    indexCount,
    omitted: [...omittedCounts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => a.type.localeCompare(b.type)),
    omittedConcepts: omittedConcepts.sort((a, b) => a.id.localeCompare(b.id)),
    warnings: extraWarnings.sort(),
    files: written,
  }
}
