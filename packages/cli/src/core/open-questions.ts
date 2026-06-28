// Agent Readiness Gate for Open Questions (VS-064).
//
// Extracts `## Open Questions` from knowledge artifacts, classifies each deterministically
// (blocking / important / deferred) and summarizes roadmap readiness so agents can pause for
// confirmation before generating a roadmap / Work Items / implementation plans. No LLM, no writes,
// never resolves questions automatically.

import { exists, readFile, join } from '../utils/fs.js'
import { loadConfig } from './config.js'

export type QuestionClass = 'blocking' | 'important' | 'deferred'

/** Resolution lifecycle of a question (VS-071). Only `open` blocks readiness. */
export type ResolutionStatus = 'open' | 'resolved' | 'assumed' | 'deferred'

export type OpenQuestion = {
  id: string
  source: string
  section: string
  question: string
  classification: QuestionClass
  resolution_status: ResolutionStatus
  reason: string
  resolution_note?: string
  suggested_assumption?: string
}

export type RoadmapReadiness = 'ready' | 'needs_decisions' | 'unknown'

export type OpenQuestionsReport = {
  generated_at: string
  project: string
  summary: {
    open_questions: number
    roadmap_readiness: RoadmapReadiness
    // Classification counts (kept for backward compatibility).
    blocking: number
    important: number
    deferred: number
    // Readiness counts: only questions still `open` are counted here (VS-071).
    blocking_open: number
    important_open: number
    // Counts by resolution status.
    resolution: { open: number; resolved: number; assumed: number; deferred: number }
  }
  questions: OpenQuestion[]
  blocking_questions: OpenQuestion[]
  important_questions: OpenQuestion[]
  deferred_questions: OpenQuestion[]
  resolved_questions: OpenQuestion[]
  assumed_questions: OpenQuestion[]
  deferred_status_questions: OpenQuestion[]
  suggested_assumptions: string[]
  recommended_next_step: string
}

// Resolution-status tokens recognized at the start of a question line (EN + ES). Case-insensitive.
const RESOLUTION_TOKENS: Record<string, ResolutionStatus> = {
  open: 'open', resolved: 'resolved', assumed: 'assumed', deferred: 'deferred',
  abierta: 'open', resuelta: 'resolved', asumida: 'assumed', diferida: 'deferred',
}

/** Strip a leading `[status]` token from a question line. Defaults to `open` when absent. */
export function parseResolution(line: string): { text: string; resolution_status: ResolutionStatus } {
  const m = line.match(/^\[([a-zA-Záéí]+)\]\s*(.*)$/)
  if (m) {
    const status = RESOLUTION_TOKENS[m[1].toLowerCase()]
    if (status) return { text: m[2].trim(), resolution_status: status }
  }
  return { text: line.trim(), resolution_status: 'open' }
}

// Files scanned for an `## Open Questions` section, in priority order.
const SOURCES = [
  'knowledge/business/business.md',
  'knowledge/product/product.md',
  'knowledge/tech/codebase.md',
  'knowledge/delivery/roadmap.md',
]

// Conservative keyword heuristics (case-insensitive, EN + ES). When in doubt → important.
const BLOCKING = [
  'mvp', 'stack', 'arquitect', 'architecture', 'api', 'web app', 'webapp', 'cli', 'backend',
  'auth', 'autenticaci', 'persist', 'base de datos', 'database', 'roadmap', 'alcance', 'scope',
  'primera versión', 'primera version', 'first version', 'fastify', 'nestjs', 'framework',
]
const DEFERRED = [
  'integraci', 'integration', 'analytics', 'notificaci', 'notification', 'google calendar',
  'eventbrite', 'meetup', 'dashboard', 'multi-tenant', 'multitenant', 'mobile', 'móvil', 'pago',
  'payment', 'ticketing', 'multiple tracks', 'múltiples tracks', 'webhook',
]
const IMPORTANT = [
  'validaci', 'validation', 'paginaci', 'pagination', 'soft delete', 'sponsor', 'agenda',
  'ubicaci', 'location', 'rol', 'role', 'permis', 'permission',
]

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k))
}

/** Classify a single open question deterministically. Defaults to `important` when ambiguous. */
export function classifyQuestion(question: string): { classification: QuestionClass; reason: string } {
  const t = question.toLowerCase()
  if (matchesAny(t, BLOCKING)) {
    return { classification: 'blocking', reason: 'Affects scope, architecture or the first Work Items.' }
  }
  if (matchesAny(t, DEFERRED) && !matchesAny(t, IMPORTANT)) {
    return { classification: 'deferred', reason: 'Can be moved to a later phase.' }
  }
  if (matchesAny(t, IMPORTANT)) {
    return { classification: 'important', reason: 'Relevant, but a temporary assumption can unblock progress.' }
  }
  // Conservative default.
  return { classification: 'important', reason: 'Relevant, but a temporary assumption can unblock progress.' }
}

type ExtractedQuestion = { text: string; resolution_status: ResolutionStatus; resolution_note?: string }

/** Extract the bullet/numbered lines under an `## Open Questions` section of a markdown file. */
function extractFromMarkdown(md: string): ExtractedQuestion[] {
  const lines = md.split(/\r?\n/)
  const start = lines.findIndex((l) => /^#{1,6}\s+open questions\s*$/i.test(l.trim()) || /^#{1,6}\s+preguntas abiertas\s*$/i.test(l.trim()))
  if (start < 0) return []
  const out: ExtractedQuestion[] = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^#{1,6}\s+/.test(line)) break // next heading ends the section
    // Indented metadata sub-bullet (e.g. `  - note: ...`) attaches to the previous question.
    const meta = line.match(/^\s+(?:[-*])\s+(\w+)\s*:\s*(.+?)\s*$/)
    if (meta && out.length > 0) {
      if (meta[1].toLowerCase() === 'note') out[out.length - 1].resolution_note = meta[2].trim()
      continue
    }
    const m = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+?)\s*$/)
    if (m) {
      const raw = m[1].trim()
      if (!raw || /^_.*_$/.test(raw)) continue
      const { text, resolution_status } = parseResolution(raw)
      if (text) out.push({ text, resolution_status })
    }
  }
  return out
}

/** A short, neutral suggested assumption for a blocking question (never invents specifics). */
function suggestedAssumption(question: string): string {
  const t = question.toLowerCase()
  if (matchesAny(t, ['api', 'web app', 'webapp', 'cli', 'backend'])) {
    return 'Start as a backend API to keep the initial scope small.'
  }
  if (matchesAny(t, ['auth', 'autenticaci'])) {
    return 'No authentication in the MVP.'
  }
  if (matchesAny(t, ['fastify', 'nestjs', 'framework', 'stack'])) {
    return 'Choose the lighter stack option to minimize MVP scope.'
  }
  if (matchesAny(t, ['persist', 'base de datos', 'database'])) {
    return 'Use a simple local datastore (e.g. SQLite) for the MVP.'
  }
  return 'Proceed with the smallest reasonable MVP interpretation and revisit later.'
}

/** Build the open-questions readiness report. Deterministic; reads only knowledge markdown. */
export function buildOpenQuestionsReport(dir: string, now: Date = new Date()): OpenQuestionsReport {
  const project = loadConfig(dir)?.project.name ?? 'unknown'
  const questions: OpenQuestion[] = []
  let seq = 0
  for (const source of SOURCES) {
    const p = join(dir, source)
    if (!exists(p)) continue
    let md: string
    try {
      md = readFile(p)
    } catch {
      continue
    }
    for (const eq of extractFromMarkdown(md)) {
      seq += 1
      const { classification, reason } = classifyQuestion(eq.text)
      questions.push({
        id: `OQ-${String(seq).padStart(3, '0')}`,
        source,
        section: 'Open Questions',
        question: eq.text,
        classification,
        resolution_status: eq.resolution_status,
        reason,
        ...(eq.resolution_note ? { resolution_note: eq.resolution_note } : {}),
        ...(classification === 'blocking' && eq.resolution_status === 'open'
          ? { suggested_assumption: suggestedAssumption(eq.text) }
          : {}),
      })
    }
  }

  const blocking = questions.filter((q) => q.classification === 'blocking')
  const important = questions.filter((q) => q.classification === 'important')
  const deferred = questions.filter((q) => q.classification === 'deferred')

  // Only questions still `open` count toward readiness (VS-071).
  const blockingOpen = blocking.filter((q) => q.resolution_status === 'open')
  const importantOpen = important.filter((q) => q.resolution_status === 'open')

  const byStatus = (s: ResolutionStatus) => questions.filter((q) => q.resolution_status === s)
  const resolved = byStatus('resolved')
  const assumed = byStatus('assumed')
  const deferredStatus = byStatus('deferred')

  let readiness: RoadmapReadiness
  if (questions.length === 0) readiness = 'unknown'
  else if (blockingOpen.length > 0) readiness = 'needs_decisions'
  else readiness = 'ready'

  const suggested_assumptions = blockingOpen.map((q) => q.suggested_assumption!).filter(Boolean)
  const recommended_next_step =
    readiness === 'needs_decisions'
      ? 'Confirm suggested assumptions with the user (resolve, assume or defer blocking open questions) before generating the roadmap.'
      : readiness === 'ready'
        ? 'No blocking open questions — you can proceed to the roadmap. Surfaced assumptions/deferred items are informational.'
        : 'No open questions found. Run `kaddo bootstrap` to capture early questions, or proceed.'

  return {
    generated_at: now.toISOString(),
    project,
    summary: {
      open_questions: questions.length,
      roadmap_readiness: readiness,
      blocking: blocking.length,
      important: important.length,
      deferred: deferred.length,
      blocking_open: blockingOpen.length,
      important_open: importantOpen.length,
      resolution: {
        open: byStatus('open').length,
        resolved: resolved.length,
        assumed: assumed.length,
        deferred: deferredStatus.length,
      },
    },
    questions,
    blocking_questions: blocking,
    important_questions: important,
    deferred_questions: deferred,
    resolved_questions: resolved,
    assumed_questions: assumed,
    deferred_status_questions: deferredStatus,
    suggested_assumptions,
    recommended_next_step,
  }
}

export function renderOpenQuestionsMarkdown(r: OpenQuestionsReport): string {
  const L: string[] = []
  L.push('# Kaddo Open Questions Readiness Report', '')
  L.push(`Generated at: ${r.generated_at}`)
  L.push(`Project: ${r.project}`)
  L.push('')

  L.push('## Summary', '')
  L.push(`- Open questions found: ${r.summary.open_questions}`)
  L.push(`- Roadmap readiness: ${r.summary.roadmap_readiness}`)
  L.push(`- By resolution — open: ${r.summary.resolution.open}, resolved: ${r.summary.resolution.resolved}, assumed: ${r.summary.resolution.assumed}, deferred: ${r.summary.resolution.deferred}`)
  L.push(`- Blocking open: ${r.summary.blocking_open}, important open: ${r.summary.important_open}`)
  L.push('')

  if (r.summary.open_questions === 0) {
    L.push('No `## Open Questions` sections found in business / product / codebase / roadmap.', '')
    L.push('## Recommended Next Step', '', r.recommended_next_step, '')
    return L.join('\n')
  }

  const blockingOpen = r.blocking_questions.filter((q) => q.resolution_status === 'open')
  L.push('## Blocking Open Questions', '')
  if (blockingOpen.length === 0) L.push('_None — nothing blocks readiness._', '')
  for (const q of blockingOpen) {
    L.push(`### ${q.id}`, '')
    L.push(`- Source: \`${q.source}\``)
    L.push(`- Question: ${q.question}`)
    L.push(`- Reason: ${q.reason}`)
    if (q.suggested_assumption) L.push(`- Suggested assumption: ${q.suggested_assumption}`)
    L.push('')
  }

  const renderStatusList = (title: string, items: OpenQuestion[]) => {
    L.push(`## ${title}`, '')
    if (items.length === 0) L.push('_None._')
    for (const q of items) L.push(`- ${q.question}${q.resolution_note ? ` — _${q.resolution_note}_` : ''}`)
    L.push('')
  }
  renderStatusList('Resolved', r.resolved_questions)
  renderStatusList('Assumed (decisions to revisit)', r.assumed_questions)
  renderStatusList('Deferred (out of current scope)', r.deferred_status_questions)

  L.push('## Important Questions', '')
  if (r.important_questions.length === 0) L.push('_None._')
  for (const q of r.important_questions) L.push(`- [${q.resolution_status}] ${q.question}`)
  L.push('')

  if (r.suggested_assumptions.length > 0) {
    L.push('## Suggested Assumptions', '')
    for (const a of r.suggested_assumptions) L.push(`- ${a}`)
    L.push('')
  }

  L.push('## Recommended Next Step', '', r.recommended_next_step, '')
  return L.join('\n')
}

export function serializeOpenQuestionsJson(r: OpenQuestionsReport): string {
  return JSON.stringify(r, null, 2) + '\n'
}

/** Compact readiness summary for `kaddo://roadmap-readiness`. */
export function roadmapReadinessSummary(dir: string): {
  roadmap_readiness: RoadmapReadiness
  blocking_questions: number
  blocking_open: number
  important_questions: number
  deferred_questions: number
  resolution: { open: number; resolved: number; assumed: number; deferred: number }
  suggested_assumptions: string[]
  recommended_next_step: string
} {
  const r = buildOpenQuestionsReport(dir)
  return {
    roadmap_readiness: r.summary.roadmap_readiness,
    blocking_questions: r.summary.blocking,
    blocking_open: r.summary.blocking_open,
    important_questions: r.summary.important,
    deferred_questions: r.summary.deferred,
    resolution: r.summary.resolution,
    suggested_assumptions: r.suggested_assumptions,
    recommended_next_step:
      r.summary.roadmap_readiness === 'needs_decisions'
        ? 'Resolve, assume, or defer blocking open questions before generating roadmap.'
        : r.recommended_next_step,
  }
}
