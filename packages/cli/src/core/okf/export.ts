// OKF export (WI-065): project Kaddo's canonical knowledge into a portable OKF v0.2 bundle.
//
// Read-only over existing Core readers. Deterministic for a given logical snapshot (concepts and
// files are id-sorted). Never modifies source artifacts, never runs external commands, and only reads
// knowledge/*.md artifacts (no code, no .env, no secrets). The output area is cleared and rewritten,
// so repeated exports keep stable identities and paths.

import fs from 'node:fs'
import path from 'node:path'
import { discoverKnowledge } from '../../services/knowledge-artifacts.js'
import { buildConcept } from './mapping.js'
import { OKF_VERSION, type OkfConcept, type OkfExportResult } from './types.js'

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

function renderConcept(c: OkfConcept, byId: Map<string, OkfConcept>): string {
  const data: Record<string, unknown> = {
    type: c.type,
    title: c.title,
    description: c.description,
    tags: c.tags,
    // Provenance: the real canonical source path. Never invented.
    sources: [{ resource: c.sourcePath }],
    kaddo_id: c.id,
  }
  const parts = [frontmatter(data), '', `# ${c.title}`]
  if (c.description) parts.push('', c.description)
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

function renderIndex(title: string, concepts: OkfConcept[], fromPath: string, root: boolean): string {
  const data: Record<string, unknown> = { type: 'Index', title }
  if (root) data.okf_version = OKF_VERSION
  const parts = [frontmatter(data), '', `# ${title}`, '']
  if (root) parts.push(`Open Knowledge Format bundle — version ${OKF_VERSION}. A portable projection of`,
    'Kaddo knowledge. Kaddo remains the source of truth.', '')
  const byType = new Map<string, OkfConcept[]>()
  for (const c of concepts) { const l = byType.get(c.type) ?? []; l.push(c); byType.set(c.type, l) }
  for (const type of [...byType.keys()].sort()) {
    parts.push(`## ${type}`)
    for (const c of byType.get(type)!.sort((a, b) => a.id.localeCompare(b.id))) {
      parts.push(`- [${c.title}](${relLink(fromPath, c.path)})`)
    }
    parts.push('')
  }
  return parts.join('\n')
}

function atomicWrite(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content, 'utf-8')
}

// High-signal secret patterns. Conservative, to warn (never block) without noise on prose that merely
// mentions "token" or "password". The export only reads knowledge/*.md, so this is a safety backstop.
const SENSITIVE_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, label: 'private key block' },
  { re: /\bAKIA[0-9A-Z]{16}\b/, label: 'AWS access key id' },
  { re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/, label: 'GitHub token' },
  { re: /\b(?:password|secret|api[_-]?key|access[_-]?token)\b\s*[:=]\s*["']?[A-Za-z0-9+/_\-]{12,}/i, label: 'inline credential' },
]

/** Scan a rendered concept for potentially sensitive content; returns warning messages. */
function scanSensitive(renderedPath: string, content: string): string[] {
  const hits = SENSITIVE_PATTERNS.filter((p) => p.re.test(content)).map((p) => p.label)
  return hits.length > 0 ? [`${renderedPath}: possible ${[...new Set(hits)].join(', ')} — review before sharing.`] : []
}

/**
 * Export the project's knowledge as an OKF v0.2 bundle. `output` is a project-relative or absolute
 * directory (default `.kaddo/okf`); it is cleared and rewritten.
 */
export function exportOkf(dir: string, opts: { output?: string } = {}): OkfExportResult {
  const outRel = opts.output ?? OKF_DEFAULT_OUTPUT
  const outputDir = path.isAbsolute(outRel) ? outRel : path.join(dir, outRel)

  const artifacts = discoverKnowledge(dir)
  const concepts: OkfConcept[] = []
  const seen = new Set<string>()
  const omittedCounts = new Map<string, number>()
  for (const a of artifacts) {
    const c = buildConcept(a)
    if (!c) { omittedCounts.set(a.type || 'unknown', (omittedCounts.get(a.type || 'unknown') ?? 0) + 1); continue }
    if (seen.has(c.id)) continue // stable identity: first wins
    seen.add(c.id)
    concepts.push(c)
  }
  concepts.sort((a, b) => a.id.localeCompare(b.id))
  const byId = new Map(concepts.map((c) => [c.id, c]))

  // Group by top-level bundle layer for per-layer indexes.
  const layerOf = (p: string) => p.split('/')[0]
  const byLayer = new Map<string, OkfConcept[]>()
  for (const c of concepts) { const l = byLayer.get(layerOf(c.path)) ?? []; l.push(c); byLayer.set(layerOf(c.path), l) }

  // Clear and rewrite only the output area.
  fs.rmSync(outputDir, { recursive: true, force: true })
  fs.mkdirSync(outputDir, { recursive: true })

  const written: string[] = []
  const warnings: string[] = []
  const write = (bundlePath: string, content: string) => {
    atomicWrite(path.join(outputDir, bundlePath), content)
    written.push(bundlePath)
    warnings.push(...scanSensitive(bundlePath, content))
  }

  for (const c of concepts) write(c.path, renderConcept(c, byId))
  for (const layer of [...byLayer.keys()].sort()) {
    const title = layer.charAt(0).toUpperCase() + layer.slice(1)
    write(`${layer}/index.md`, renderIndex(`${title} Knowledge`, byLayer.get(layer)!, `${layer}/index.md`, false))
  }
  write('index.md', renderIndex('Knowledge bundle', concepts, 'index.md', true))

  written.sort()
  return {
    outputDir,
    conceptCount: concepts.length,
    indexCount: byLayer.size + 1,
    omitted: [...omittedCounts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => a.type.localeCompare(b.type)),
    warnings: warnings.sort(),
    files: written,
  }
}
