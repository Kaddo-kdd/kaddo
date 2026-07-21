// Knowledge Capsules (VS-054).
//
// A Knowledge Capsule is a minimal, portable, versionable summary that one project exports about
// itself so OTHER projects can consume it as external context — without mapping it as a multirepo
// or reading its source. Deterministic: the CLI reads only `knowledge/` markdown (never source
// code, never secrets) and produces a best-effort draft; the capsule-agent refines it.

import matter from 'gray-matter'
import { exists, readFile, writeFile, readDir, join, isFile, isDir } from '../utils/fs.js'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { discoverKnowledge } from '../services/knowledge-artifacts.js'
import { loadOwners } from '../services/owners.js'
import type { KaddoConfig } from './config.js'
import { readModuleContext } from '../services/mapped-modules.js'
import { readModulesDescriptor } from '../commands/modules-map.js'

const KNOWLEDGE = 'knowledge'

export type KnowledgeCapsule = {
  system: string
  version: number
  updatedAt: string
  owner: string
  sourceProject: string
  sourceCommit?: string
  purpose: string
  responsibilities: string[]
  capabilities: string[]
  contracts: string[]
  dependencies: string[]
  knownRisks: string[]
  adrs: string[]
  owners: string[]
  outOfScope: string[]
  usageNotes: string[]
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

/** First non-empty, non-heading paragraph of a markdown file (summary). */
function firstParagraph(md: string): string {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '')
  for (const block of body.split(/\n\s*\n/)) {
    const t = block.trim()
    if (t && !t.startsWith('#') && !t.startsWith('>')) return t.replace(/\s+/g, ' ')
  }
  return ''
}

function readIf(dir: string, rel: string): string | null {
  const p = join(dir, rel)
  return exists(p) ? readFile(p) : null
}

/** Extract `## `/`### ` heading titles from a markdown file. */
function headings(md: string): string[] {
  return md
    .split(/\r?\n/)
    .map((l) => l.match(/^#{2,3}\s+(.+?)\s*$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => m[1].trim())
    .filter((h) => !/^(summary|resumen|overview|risks|owners|out of scope)$/i.test(h))
}

/**
 * Build a deterministic Knowledge Capsule draft from the project's `knowledge/`. It never reads
 * source code or secrets. Sections it cannot infer are left for the capsule-agent to complete.
 */
export function buildCapsule(dir: string, config: KaddoConfig): KnowledgeCapsule {
  const ownerMap = loadOwners(dir)
  const owners = [...new Set(Object.values(ownerMap).flat())]
  const all = discoverKnowledge(dir)

  const purposeSrc =
    readIf(dir, `${KNOWLEDGE}/business/business.md`) ?? readIf(dir, `${KNOWLEDGE}/knowledge.md`) ?? ''
  const capsMd = readIf(dir, `${KNOWLEDGE}/product/capabilities.md`)
  const risksMd = readIf(dir, `${KNOWLEDGE}/legacy/risks.md`)

  const adrs = all
    .filter((a) => a.filePath.replace(/\\/g, '/').includes('/tech/decisions/') && Boolean(a.type))
    .map((a) => a.title || a.id)
    .filter(Boolean)

  return {
    system: config.project.name,
    version: 1,
    updatedAt: today(),
    owner: owners[0] ?? 'unknown',
    sourceProject: config.project.name,
    purpose: firstParagraph(purposeSrc),
    responsibilities: [],
    capabilities: capsMd ? headings(capsMd) : [],
    contracts: [],
    dependencies: [],
    knownRisks: risksMd ? headings(risksMd) : [],
    adrs,
    owners,
    outOfScope: [],
    usageNotes: [],
  }
}

/**
 * Build a system-scope capsule: includes the main capsule plus summaries of all mapped modules.
 */
export function buildSystemCapsule(dir: string, config: KaddoConfig): KnowledgeCapsule {
  const capsule = buildCapsule(dir, config)
  const descriptor = readModulesDescriptor(dir)
  for (const m of descriptor.modules) {
    const ctx = readModuleContext(dir, m.repoPath)
    if (ctx) {
      capsule.responsibilities.push(`[${m.id}] ${firstParagraph(ctx) || m.name}`)
    } else {
      capsule.responsibilities.push(`[${m.id}] ${m.name} (no module-context)`)
    }
  }
  return capsule
}

/**
 * Build a module-scope capsule from a mapped module's knowledge.
 */
export function buildModuleCapsule(dir: string, moduleId: string, config: KaddoConfig): KnowledgeCapsule | null {
  const descriptor = readModulesDescriptor(dir)
  const mod = descriptor.modules.find((m) => m.id === moduleId)
  if (!mod) return null
  const ctx = readModuleContext(dir, mod.repoPath)
  return {
    system: `${config.project.name}/${moduleId}`,
    version: 1,
    updatedAt: today(),
    owner: mod.owner || 'unknown',
    sourceProject: config.project.name,
    purpose: ctx ? firstParagraph(ctx) : '',
    responsibilities: [],
    capabilities: mod.capabilities,
    contracts: [],
    dependencies: [],
    knownRisks: [],
    adrs: [],
    owners: mod.owner ? [mod.owner] : [],
    outOfScope: [],
    usageNotes: [],
  }
}

function section(title: string, items: string[], placeholder: string): string {
  if (items.length === 0) return `## ${title}\n\n_${placeholder}_\n`
  return `## ${title}\n\n${items.map((i) => `- ${i}`).join('\n')}\n`
}

/** Render a capsule as portable Markdown. */
export function renderCapsuleMarkdown(c: KnowledgeCapsule): string {
  const fm = [
    '---',
    'type: knowledge-capsule',
    `system: ${c.system}`,
    `version: ${c.version}`,
    `updated_at: ${c.updatedAt}`,
    `owner: ${c.owner}`,
    `source_project: ${c.sourceProject}`,
    ...(c.sourceCommit ? [`source_commit: ${c.sourceCommit}`] : []),
    '---',
  ].join('\n')

  const parts = [
    fm,
    '',
    `# ${c.system} — Knowledge Capsule`,
    '',
    `## Purpose\n\n${c.purpose || '_To be completed by the capsule-agent._'}\n`,
    section('Responsibilities', c.responsibilities, 'List what this system is responsible for.'),
    section('Exposed Capabilities', c.capabilities, 'List the capabilities this system exposes.'),
    section('Public Contracts', c.contracts, 'List public APIs and events (e.g. `POST /orders`, `OrderCreated`).'),
    section('Dependencies', c.dependencies, 'List systems this one depends on.'),
    section('Known Risks', c.knownRisks, 'List integration risks consumers should know.'),
    section('Relevant ADRs', c.adrs, 'List decisions that affect how to integrate.'),
    section('Owners', c.owners, 'Who owns this system.'),
    section('Out of Scope', c.outOfScope, 'What this capsule deliberately does not cover.'),
    section('Usage Notes', c.usageNotes, 'How consumers should integrate.'),
    '> Security: this capsule must never contain secrets, tokens, credentials, PII or source code.',
    '',
  ]
  return parts.join('\n')
}

export function serializeCapsuleJson(c: KnowledgeCapsule): string {
  return JSON.stringify({ type: 'knowledge-capsule', ...c }, null, 2) + '\n'
}

// ---------------------------------------------------------------------------
// Consuming external capsules
// ---------------------------------------------------------------------------

export type ExternalCapsuleEntry = {
  id: string
  type: 'knowledge-capsule'
  path: string
  owner?: string
  lastImportedAt?: string
}

const EXTERNAL_PATH = '.kaddo/external.yml'

export function loadExternalRegistry(dir: string): ExternalCapsuleEntry[] {
  const p = join(dir, EXTERNAL_PATH)
  if (!exists(p)) return []
  try {
    const parsed = parseYaml(readFile(p)) as { external?: ExternalCapsuleEntry[] }
    return Array.isArray(parsed?.external) ? parsed.external : []
  } catch {
    return []
  }
}

export function serializeExternalRegistry(entries: ExternalCapsuleEntry[]): string {
  return stringifyYaml({ external: entries })
}

/** A parsed summary of a consumed capsule, for context/explain. */
export type ConsumedCapsule = {
  id: string
  path: string
  system: string
  owner?: string
  updatedAt?: string
  purpose: string
  capabilities: string[]
  contracts: string[]
  knownRisks: string[]
  /** Days since updated_at, or null if unknown. */
  ageDays: number | null
}

function sectionList(md: string, title: string): string[] {
  const re = new RegExp(`^##\\s+${title}\\s*$`, 'im')
  const lines = md.split(/\r?\n/)
  const start = lines.findIndex((l) => re.test(l))
  if (start < 0) return []
  const out: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) break
    const m = lines[i].match(/^\s*-\s+(.+?)\s*$/)
    if (m && !/^_.*_$/.test(m[1])) out.push(m[1].trim())
  }
  return out
}

function sectionParagraph(md: string, title: string): string {
  const re = new RegExp(`^##\\s+${title}\\s*$`, 'im')
  const lines = md.split(/\r?\n/)
  const start = lines.findIndex((l) => re.test(l))
  if (start < 0) return ''
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) break
    const t = lines[i].trim()
    if (t && !/^_.*_$/.test(t)) return t
  }
  return ''
}

/** Parse a capsule markdown into a summary for context/explain. */
export function parseCapsule(id: string, path: string, md: string): ConsumedCapsule {
  const { data } = matter(md)
  const updatedAt = data.updated_at ? String(data.updated_at) : undefined
  let ageDays: number | null = null
  if (updatedAt) {
    const d = Date.parse(updatedAt)
    if (!Number.isNaN(d)) ageDays = Math.max(0, Math.floor((Date.now() - d) / 86_400_000))
  }
  return {
    id,
    path,
    system: data.system ? String(data.system) : id,
    owner: data.owner ? String(data.owner) : undefined,
    updatedAt,
    purpose: sectionParagraph(md, 'Purpose'),
    capabilities: sectionList(md, 'Exposed Capabilities'),
    contracts: sectionList(md, 'Public Contracts'),
    knownRisks: sectionList(md, 'Known Risks'),
    ageDays,
  }
}

function slugId(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'external'
}

export type AddCapsuleResult = { id: string; destRel: string; entry: ExternalCapsuleEntry; isCapsuleType: boolean }

/**
 * Register an external Knowledge Capsule into `dir`: copy it under `external/<id>.capsule.md` and
 * record it in `.kaddo/external.yml`. Pure (no cwd, no logging) so it is testable. Throws if the
 * source file is missing.
 */
export function addExternalCapsule(dir: string, sourceFile: string): AddCapsuleResult {
  if (!exists(sourceFile)) throw new Error(`Capsule not found: ${sourceFile}`)
  const raw = readFile(sourceFile)
  const { data } = matter(raw)
  const isCapsuleType = data.type === 'knowledge-capsule'
  const fallbackName = sourceFile.split(/[\\/]/).pop()?.replace(/\.capsule\.md$/, '') ?? 'external'
  const id = slugId(String(data.system ?? fallbackName))

  const destRel = join('external', `${id}.capsule.md`).replace(/\\/g, '/')
  writeFile(join(dir, destRel), raw)

  const entry: ExternalCapsuleEntry = {
    id,
    type: 'knowledge-capsule',
    path: destRel,
    owner: data.owner ? String(data.owner) : undefined,
    lastImportedAt: new Date().toISOString().split('T')[0],
  }
  const registry = loadExternalRegistry(dir).filter((e) => e.id !== id)
  registry.push(entry)
  writeFile(join(dir, EXTERNAL_PATH), serializeExternalRegistry(registry))

  return { id, destRel, entry, isCapsuleType }
}

/** Load and parse every registered external capsule (skips missing/unreadable files). */
export function loadExternalCapsules(dir: string): ConsumedCapsule[] {
  const out: ConsumedCapsule[] = []
  for (const entry of loadExternalRegistry(dir)) {
    const full = join(dir, entry.path)
    if (!exists(full) || !isFile(full)) continue
    try {
      out.push(parseCapsule(entry.id, entry.path, readFile(full)))
    } catch {
      // skip unreadable
    }
  }
  return out
}

// re-export for command use
export { exists, isDir, readDir }
