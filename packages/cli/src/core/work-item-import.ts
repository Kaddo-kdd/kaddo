// Work Item import from external content (VS-109).
//
// Canonical pipeline: parse → normalize → validate → register → handoff.
// All adapters (CLI, MCP, future Admin) converge on importWorkItem().
// Import never executes a Work Item — it only creates a draft and builds
// a refinement handoff. The content is DATA, never instructions.

import crypto from 'node:crypto'
import fs from 'node:fs'
import matter from 'gray-matter'
import { normalizeType } from './knowledge-levels.js'
import { createWorkItem, type WorkItemSourceInput, type ExternalSnapshot } from './work-item-write.js'
import { buildRefinementHandoff, type RefinementHandoff } from './work-item-refinement.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'
import { readFile } from '../utils/fs.js'

const MAX_INPUT_BYTES = 102_400 // 100 KB

// --- Public types ------------------------------------------------------------

export type DetectedFormat = 'kaddo-frontmatter' | 'markdown-frontmatter' | 'markdown' | 'plain-text'

export type ParsedContent = {
  format: DetectedFormat
  title: string
  type?: string
  summary: string
  body: string
  candidateFields: Record<string, unknown>
  sections: Map<string, string>
}

export type ImportWorkItemOpts = {
  content: string
  source: 'chat' | 'cli' | 'admin'
  type?: string
  filePath?: string
  onConflict?: 'replace' | 'new-id'
}

export type IdConflict = {
  importedId: string
  existingPath: string
}

export type ImportWorkItemResult = {
  created: boolean
  workItemId: string
  path: string
  status: 'draft'
  source: string
  sourceFormat: DetectedFormat
  sourceHash: string
  duplicateOf?: string
  executed: false
  refinementHandoff?: RefinementHandoff
  discardedFields?: string[]
  conflict?: IdConflict
  replacedWorkItem?: string
}

// --- Lifecycle-controlled fields that external content must never override ---

const LIFECYCLE_FIELDS = new Set([
  'id', 'status', 'phase', 'knowledge_level', 'refined_by', 'implemented_by',
  'closed_by', 'ready_at', 'generated_by', 'template_version',
  'implementation_status', 'validation_status', 'release_status',
])

// --- Format detection --------------------------------------------------------

export function detectFormat(raw: string): DetectedFormat {
  const trimmed = raw.trim()
  if (!trimmed) throw new ImportError('EMPTY_INPUT', 'Import content is empty.')

  if (trimmed.startsWith('---')) {
    try {
      const { data } = matter(trimmed)
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        const d = data as Record<string, unknown>
        if (d.type === 'work-item' || (d.id && typeof d.id === 'string' && /^WI-\d+/.test(d.id))) {
          return 'kaddo-frontmatter'
        }
        return 'markdown-frontmatter'
      }
    } catch { /* not valid frontmatter — treat as markdown or plain text */ }
  }

  if (/^#{1,2}\s+/m.test(trimmed)) return 'markdown'
  return 'plain-text'
}

// --- Content parsing ---------------------------------------------------------

export function parseContent(raw: string): ParsedContent {
  const trimmed = raw.trim()
  if (!trimmed) throw new ImportError('EMPTY_INPUT', 'Import content is empty.')

  const format = detectFormat(trimmed)
  let frontmatterFields: Record<string, unknown> = {}
  let bodyText = trimmed

  if (format === 'kaddo-frontmatter' || format === 'markdown-frontmatter') {
    try {
      const parsed = matter(trimmed)
      frontmatterFields = (parsed.data ?? {}) as Record<string, unknown>
      bodyText = parsed.content.trim()
    } catch { /* parse failure — use the whole text as body */ }
  }

  const title = extractTitle(frontmatterFields, bodyText)
  const candidateType = extractType(frontmatterFields)
  const sections = extractSections(bodyText)

  const summary = bodyText || title

  return {
    format,
    title,
    type: candidateType,
    summary,
    body: bodyText,
    candidateFields: frontmatterFields,
    sections,
  }
}

function extractTitle(fields: Record<string, unknown>, body: string): string {
  if (typeof fields.title === 'string' && fields.title.trim()) {
    return fields.title.trim().slice(0, 120)
  }
  const h1Match = body.match(/^#\s+(.+)$/m)
  if (h1Match) return h1Match[1].trim().slice(0, 120)
  const firstLine = body.split(/\r?\n/).find((l) => l.trim())
  return (firstLine?.trim() ?? 'Untitled Work Item').slice(0, 120)
}

function extractType(fields: Record<string, unknown>): string | undefined {
  const raw = (typeof fields.work_type === 'string' && fields.work_type.trim())
    ? fields.work_type.trim()
    : (typeof fields.type === 'string' && fields.type.trim() && fields.type !== 'work-item')
      ? fields.type.trim()
      : undefined
  if (!raw) return undefined
  return normalizeType(raw) ?? undefined
}

function extractSections(body: string): Map<string, string> {
  const sections = new Map<string, string>()
  const lines = body.split(/\r?\n/)
  let currentHeading: string | null = null
  let buffer: string[] = []

  const flush = () => {
    if (currentHeading) {
      sections.set(currentHeading.toLowerCase(), buffer.join('\n').trim())
    }
    buffer = []
  }

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/)
    if (match) {
      flush()
      currentHeading = match[1].trim()
    } else if (currentHeading) {
      buffer.push(line)
    }
  }
  flush()

  return sections
}

// --- Normalization -----------------------------------------------------------

type NormalizedImport = {
  type: string
  intent: string
  source: WorkItemSourceInput
  snapshot: ExternalSnapshot
  discardedFields: string[]
}

export function normalizeImportFields(
  parsed: ParsedContent,
  opts: { userType?: string; importSource: string; sourceHash: string; sourceFormat: DetectedFormat },
): NormalizedImport {
  const discardedFields: string[] = []
  for (const key of Object.keys(parsed.candidateFields)) {
    if (LIFECYCLE_FIELDS.has(key)) discardedFields.push(key)
  }

  const type = opts.userType
    ? (normalizeType(opts.userType) ?? 'feature')
    : (parsed.type ?? 'feature')

  const intent = parsed.body && parsed.body !== parsed.title
    ? `${parsed.title}\n\n${parsed.body}`
    : parsed.title

  const source: WorkItemSourceInput = {
    type: opts.importSource === 'chat' ? 'chat' : 'external',
    imported_at: new Date().toISOString().split('T')[0],
  }
  // Store import provenance as extended fields
  ;(source as Record<string, unknown>).source_format = opts.sourceFormat
  ;(source as Record<string, unknown>).source_hash = opts.sourceHash

  const snapshot: ExternalSnapshot = { title: parsed.title }
  if (parsed.summary !== parsed.title) snapshot.description = parsed.summary
  if (typeof parsed.candidateFields.type === 'string') snapshot.type = parsed.candidateFields.type
  if (typeof parsed.candidateFields.status === 'string') snapshot.status = parsed.candidateFields.status
  if (Array.isArray(parsed.candidateFields.labels)) {
    const labels = (parsed.candidateFields.labels as string[]).filter((l) => typeof l === 'string')
    if (labels.length > 0) snapshot.labels = labels
  }

  return { type, intent, source, snapshot, discardedFields }
}

// --- Content hash ------------------------------------------------------------

export function computeContentHash(raw: string): string {
  return crypto.createHash('sha256').update(raw.trim(), 'utf-8').digest('hex')
}

// --- Duplicate detection -----------------------------------------------------

export function findDuplicateByHash(dir: string, hash: string): { workItemId: string; path: string } | undefined {
  const items = discoverWorkItems(dir)
  for (const item of items) {
    const raw = readFile(item.filePath)
    if (!raw) continue
    try {
      const { data } = matter(raw)
      const source = data?.source
      if (source && typeof source === 'object' && !Array.isArray(source)) {
        const s = source as Record<string, unknown>
        if (s.source_hash === hash) {
          return { workItemId: (data.id ?? item.id ?? item.title) as string, path: item.relPath }
        }
      }
    } catch { /* skip unparseable files */ }
  }
  return undefined
}

// --- ID conflict detection ---------------------------------------------------

export function findExistingById(dir: string, id: string): { workItemId: string; path: string; filePath: string } | undefined {
  const items = discoverWorkItems(dir)
  const match = items.find((item) => (item.id || item.title) === id)
  if (!match) return undefined
  return { workItemId: (match.id || match.title) as string, path: match.relPath, filePath: match.filePath }
}

// --- Orchestrator ------------------------------------------------------------

export function importWorkItem(dir: string, opts: ImportWorkItemOpts): ImportWorkItemResult {
  const content = opts.content
  if (!content?.trim()) throw new ImportError('EMPTY_INPUT', 'Import content is empty.')
  if (Buffer.byteLength(content, 'utf-8') > MAX_INPUT_BYTES) {
    throw new ImportError('OVERSIZED_INPUT', `Import content exceeds the ${MAX_INPUT_BYTES / 1024}KB limit.`)
  }

  const parsed = parseContent(content)
  const sourceHash = computeContentHash(content)

  const duplicate = findDuplicateByHash(dir, sourceHash)
  if (duplicate) {
    return {
      created: false,
      workItemId: duplicate.workItemId,
      path: duplicate.path,
      status: 'draft',
      source: opts.source,
      sourceFormat: parsed.format,
      sourceHash,
      duplicateOf: duplicate.workItemId,
      executed: false,
    }
  }

  const normalized = normalizeImportFields(parsed, {
    userType: opts.type,
    importSource: opts.source,
    sourceHash,
    sourceFormat: parsed.format,
  })

  const importedId = typeof parsed.candidateFields.id === 'string' ? parsed.candidateFields.id.trim() : undefined
  let replacedWorkItem: string | undefined

  if (importedId && /^WI-\d+$/.test(importedId)) {
    const existing = findExistingById(dir, importedId)
    if (existing) {
      if (!opts.onConflict) {
        return {
          created: false,
          workItemId: existing.workItemId,
          path: existing.path,
          status: 'draft',
          source: opts.source,
          sourceFormat: parsed.format,
          sourceHash,
          executed: false,
          conflict: { importedId, existingPath: existing.path },
          ...(normalized.discardedFields.length > 0 ? { discardedFields: normalized.discardedFields } : {}),
        }
      }
      if (opts.onConflict === 'replace') {
        fs.rmSync(existing.filePath, { force: true })
        replacedWorkItem = existing.workItemId
      }
    }
  }

  const result = createWorkItem(dir, {
    intent: normalized.intent,
    type: normalized.type,
    source: normalized.source,
    originalSnapshot: normalized.snapshot,
  })

  let refinementHandoff: RefinementHandoff | undefined
  try {
    refinementHandoff = buildRefinementHandoff(dir, result.id)
  } catch { /* refinement handoff is best-effort — project may lack config */ }

  return {
    created: true,
    workItemId: result.id,
    path: result.path,
    status: 'draft',
    source: opts.source,
    sourceFormat: parsed.format,
    sourceHash,
    executed: false,
    refinementHandoff,
    ...(normalized.discardedFields.length > 0 ? { discardedFields: normalized.discardedFields } : {}),
    ...(replacedWorkItem ? { replacedWorkItem } : {}),
  }
}

// --- Error -------------------------------------------------------------------

export type ImportErrorCode = 'EMPTY_INPUT' | 'OVERSIZED_INPUT' | 'INVALID_FORMAT' | 'IMPORT_FAILED'

export class ImportError extends Error {
  constructor(public readonly code: ImportErrorCode, message: string) {
    super(message)
    this.name = 'ImportError'
  }
}
