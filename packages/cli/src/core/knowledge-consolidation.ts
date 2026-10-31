// Knowledge Consolidation — deterministic analysis foundation (WI-070).
//
// Produces a reviewable Consolidation Plan that surfaces opportunities to optimize, connect and
// refine the project's canonical knowledge. This layer is STRICTLY deterministic: it never calls an
// LLM, never modifies canonical knowledge (`knowledge/`), and never resolves or echoes secrets. It
// only READS `knowledge/` artifacts and reuses existing Core foundations (knowledge discovery,
// artifact quality, graph + graph hints, reporting evidence, work-item lifecycle/learning).
//
// The hard boundary (AC-06, AC-10): facts Kaddo can verify from the files are emitted as `observed`
// opportunities; anything that needs contextual/semantic judgement (possible redundancy, whether a
// historical learning is still a live rule, implicit contradictions) is emitted as a `suggested`
// CANDIDATE flagged `requires_semantic_review` — never as a deterministic conclusion. The semantic
// layer is an agent + skill (instructions), not code in this module.

import { createHash } from 'node:crypto'
import matter from 'gray-matter'
import { exists, readFile, join, readDir, isFile } from '../utils/fs.js'
import { requireConfig } from './config.js'
import { readArtifacts, type Artifact } from '../services/artifact-reader.js'
import { discoverLayers, layerForType, type LayerName } from './knowledge-discovery.js'
import { analyzeKnowledgeArtifact, type ArtifactQuality } from './artifact-quality.js'
import { buildGraph } from './graph.js'
import { buildGraphHints, type GraphHint } from './graph-hints.js'
import { reportingProjectContext, graphHintFinding, type ReportingProjectContext } from './reporting-evidence.js'

const KNOWLEDGE = 'knowledge'

/** Opportunity families (section 3 of the WI). */
export type ConsolidationCategory =
  | 'knowledge_redundancy'
  | 'unincorporated_learning'
  | 'knowledge_fragmentation'
  | 'relationship_opportunity'
  | 'potentially_outdated'
  | 'knowledge_organization'

export const CONSOLIDATION_CATEGORIES: ConsolidationCategory[] = [
  'knowledge_redundancy',
  'unincorporated_learning',
  'knowledge_fragmentation',
  'relationship_opportunity',
  'potentially_outdated',
  'knowledge_organization',
]

/**
 * How a finding was established. Mirrors the shared `EvidenceKind` vocabulary of
 * `reporting-evidence.ts` but constrained to the four states the WI intent names:
 * observed (verifiable fact), derived (computed from facts), suggested (needs semantic judgement),
 * unknown (insufficient evidence). `suggested` has no deterministic equivalent — it is exactly what
 * Core must NOT present as fact, so it is always paired with `requires_semantic_review: true`.
 */
export type ConsolidationClassification = 'observed' | 'derived' | 'suggested' | 'unknown'

/** Confidence a human/agent should assign before acting. */
export type ConsolidationConfidence = 'verified' | 'requires-review' | 'insufficient-evidence'

export type ConsolidationScope =
  | { kind: 'all' }
  | { kind: 'layer'; layer: LayerName }
  | { kind: 'module'; module: string }

/** A source file the analysis read, with a content fingerprint for staleness detection (AC-14). */
export type ConsolidationSourceFile = { path: string; hash: string }

export type ConsolidationOpportunity = {
  /** Stable within an analysis run: derived from category + sorted source artifacts (idempotent). */
  id: string
  category: ConsolidationCategory
  classification: ConsolidationClassification
  confidence: ConsolidationConfidence
  title: string
  source_artifacts: string[]
  target_artifacts: string[]
  evidence: string[]
  rationale: string
  possible_impact: string
  suggested_action: string
  /** true when acting requires contextual/semantic judgement the deterministic layer cannot make. */
  requires_semantic_review: boolean
}

export type ConsolidationCoverage = {
  scope: string
  layers_evaluated: LayerName[]
  artifacts_evaluated: number
  work_items_evaluated: number
  excluded_sources: string[]
}

export type ConsolidationPlan = {
  generated_at: string
  scope: string
  project_context: ReportingProjectContext
  coverage: ConsolidationCoverage
  source_files: ConsolidationSourceFile[]
  opportunities: ConsolidationOpportunity[]
  summary: { total: number; by_category: Record<ConsolidationCategory, number>; requires_semantic_review: number }
}

export type ConsolidationOptions = {
  scope?: ConsolidationScope
  /** Injected clock for deterministic tests. */
  now?: Date
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

function relFromDir(dir: string, filePath: string): string {
  const d = toPosix(dir).replace(/\/+$/, '')
  const f = toPosix(filePath)
  return f.startsWith(d + '/') ? f.slice(d.length + 1) : f
}

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex')
}

/**
 * Generic/structural headings that never indicate redundancy on their own — including the shared
 * Work Item template sections, so delivery records are not mistaken for duplicated knowledge.
 */
const GENERIC_HEADINGS = new Set([
  'purpose',
  'proposito',
  'propósito',
  'intent',
  'goal',
  'objetivo',
  'summary',
  'resumen',
  'overview',
  'context',
  'contexto',
  'scope',
  'alcance',
  'out of scope',
  'fuera de alcance',
  'acceptance criteria',
  'criterios de aceptacion',
  'criterios de aceptación',
  'validation',
  'validation scenarios',
  'validacion',
  'validación',
  'escenarios de validacion',
  'escenarios de validación',
  'notes',
  'notas',
  'references',
  'referencias',
  'examples',
  'ejemplos',
  'learning',
  'learnings',
  'aprendizaje',
  'aprendizajes',
  // Work Item template sections
  'problem',
  'problema',
  'expected result',
  'resultado esperado',
  'refinement',
  'refinamiento',
  'implementation guidance',
  'guia de implementacion',
  'guía de implementación',
  'definition of done',
  'definicion de hecho',
  'definición de hecho',
  'commit gate',
  'future evolution',
  'evolucion futura',
  'evolución futura',
  'guiding principle',
  'principio rector',
  'open questions',
  'preguntas abiertas',
  'dependencies',
  'dependencias',
  'conceptual model',
  'goal',
])

/** Keywords that suggest a learning encodes a durable, live rule worth incorporating. */
const RULE_KEYWORDS = [
  'siempre',
  'nunca',
  'debe',
  'deben',
  'requiere',
  'requieren',
  'invariante',
  'restriccion',
  'restricción',
  'regla',
  'obligatorio',
  'must',
  'always',
  'never',
  'require',
  'requires',
  'constraint',
  'invariant',
  'rule',
]

function normalizeHeading(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Extract `##`/`###` heading titles from markdown body, excluding generic ones. */
function distinctiveHeadings(body: string): string[] {
  const out: string[] = []
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^#{2,3}\s+(.+?)\s*$/)
    if (!m) continue
    const norm = normalizeHeading(m[1])
    if (!norm || GENERIC_HEADINGS.has(norm)) continue
    out.push(norm)
  }
  return [...new Set(out)]
}

/** Extract the body of a named section (## heading), case-insensitive, until the next `##`. */
function sectionBody(body: string, titles: string[]): string | null {
  const lines = body.split(/\r?\n/)
  const re = new RegExp(`^#{1,3}\\s+(${titles.join('|')})\\s*$`, 'i')
  const start = lines.findIndex((l) => re.test(l))
  if (start < 0) return null
  const collected: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,3}\s+/.test(lines[i])) break
    collected.push(lines[i])
  }
  const text = collected.join('\n').trim()
  return text.length > 0 ? text : null
}

function stableOpportunityId(category: ConsolidationCategory, sources: string[]): string {
  const key = [category, ...[...sources].sort()].join('|')
  return `${category}:${sha256(key).slice(0, 12)}`
}

type LoadedArtifact = {
  artifact: Artifact
  rel: string
  body: string
  layer: LayerName | null
}

function layerOf(a: Artifact): LayerName | null {
  const byType = layerForType(a.type)
  if (byType) return byType
  const p = toPosix(a.filePath)
  if (p.includes(`/${KNOWLEDGE}/business/`)) return 'Business'
  if (p.includes(`/${KNOWLEDGE}/product/`)) return 'Product'
  if (p.includes(`/${KNOWLEDGE}/tech/`)) return 'Tech'
  if (p.includes(`/${KNOWLEDGE}/delivery/`)) return 'Delivery'
  return null
}

function inScope(la: LoadedArtifact, scope: ConsolidationScope): boolean {
  if (scope.kind === 'all') return true
  if (scope.kind === 'layer') return la.layer === scope.layer
  // module scope: artifact declares the module in affected_modules
  return la.artifact.affectedModules.includes(scope.module)
}

function label(la: LoadedArtifact): string {
  return la.artifact.id || la.rel
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

/**
 * Build a deterministic Consolidation Plan from the project's canonical knowledge. Reads only
 * `knowledge/`; writes nothing. The result is a derived projection, not a second source of truth.
 */
export function buildConsolidationPlan(dir: string, opts: ConsolidationOptions = {}): ConsolidationPlan {
  requireConfig(dir)
  const scope: ConsolidationScope = opts.scope ?? { kind: 'all' }
  const now = opts.now ?? new Date()

  const archDir = join(dir, KNOWLEDGE)
  const rawArtifacts = exists(archDir) ? readArtifacts(archDir) : []

  const loaded: LoadedArtifact[] = rawArtifacts.map((a) => {
    let body = ''
    try {
      body = matter(readFile(a.filePath)).content
    } catch {
      body = ''
    }
    return { artifact: a, rel: relFromDir(dir, a.filePath), body, layer: layerOf(a) }
  })

  const scoped = loaded.filter((la) => inScope(la, scope))
  const scopedRels = new Set(scoped.map((la) => la.rel))
  const knownIds = new Set(loaded.map((la) => la.artifact.id).filter(Boolean))

  const opportunities: ConsolidationOpportunity[] = []

  // --- D. Relationship opportunities + metadata (deterministic, from graph hints) ---
  // Reuse the graph + graph-hints foundation rather than re-deriving relationships.
  try {
    const config = requireConfig(dir)
    const graph = buildGraph(dir, config, { scope: 'all' }, now)
    const hints = buildGraphHints(dir, graph, now)
    for (const hint of hints.hints) {
      if (!hintInScope(hint, scoped)) continue
      opportunities.push(relationshipOpportunityFromHint(hint))
    }
  } catch {
    // graph/hints are optional signals; their absence never fails the analysis.
  }

  // --- E. Potentially outdated / consistency: dangling decision references (deterministic fact) ---
  for (const la of scoped) {
    const dangling = la.artifact.decisions.filter((d) => d && !knownIds.has(d) && !decisionFileExists(dir, d))
    if (dangling.length === 0) continue
    opportunities.push({
      id: stableOpportunityId('potentially_outdated', [label(la), ...dangling]),
      category: 'potentially_outdated',
      classification: 'observed',
      confidence: 'requires-review',
      title: `${label(la)} references decision(s) that no longer exist`,
      source_artifacts: [label(la)],
      target_artifacts: [label(la)],
      evidence: dangling.map((d) => `Declared decision \`${d}\` has no matching artifact in the project.`),
      rationale:
        'A reference to a missing decision is a verifiable inconsistency: either the decision artifact was removed/renamed or the reference is stale.',
      possible_impact: 'Broken traceability between a Work Item/artifact and its decisions.',
      suggested_action: 'Review and update or remove the dangling decision reference.',
      requires_semantic_review: false,
    })
  }

  // --- A. Knowledge redundancy candidates (SEMANTIC — flagged, never asserted) ---
  // Only canonical layer knowledge is compared (Business/Product/Tech/Delivery). Work Items, the
  // roadmap, and reusable scaffolding (agents/skills under knowledge/agents|skills/) intentionally
  // share a template, so comparing them for "redundancy" would be exactly the over-optimization the
  // WI warns against — `la.layer` is null for that scaffolding, which excludes it here.
  const canonical = scoped.filter(
    (la) => la.layer !== null && !isWorkItem(la) && la.artifact.type !== 'roadmap'
  )
  const byHeading = new Map<string, LoadedArtifact[]>()
  for (const la of canonical) {
    for (const h of distinctiveHeadings(la.body)) {
      const arr = byHeading.get(h) ?? []
      arr.push(la)
      byHeading.set(h, arr)
    }
  }
  // Pairs that share >= 2 distinctive headings are redundancy CANDIDATES for semantic review.
  const pairHeadings = new Map<string, { a: LoadedArtifact; b: LoadedArtifact; shared: Set<string> }>()
  for (const [heading, arts] of byHeading) {
    if (arts.length < 2) continue
    for (let i = 0; i < arts.length; i++) {
      for (let j = i + 1; j < arts.length; j++) {
        if (arts[i].rel === arts[j].rel) continue
        const key = [arts[i].rel, arts[j].rel].sort().join('||')
        const entry = pairHeadings.get(key) ?? { a: arts[i], b: arts[j], shared: new Set<string>() }
        entry.shared.add(heading)
        pairHeadings.set(key, entry)
      }
    }
  }
  for (const { a, b, shared } of pairHeadings.values()) {
    if (shared.size < 2) continue
    opportunities.push({
      id: stableOpportunityId('knowledge_redundancy', [label(a), label(b)]),
      category: 'knowledge_redundancy',
      classification: 'suggested',
      confidence: 'requires-review',
      title: `Possible overlapping content between ${label(a)} and ${label(b)}`,
      source_artifacts: [label(a), label(b)],
      target_artifacts: [label(a), label(b)],
      evidence: [`Both artifacts declare the sections: ${[...shared].sort().join(', ')}.`],
      rationale:
        'Shared section titles are a hint of potential overlap, NOT proof of duplication. Two documents can legitimately address the same topic from different layers/responsibilities.',
      possible_impact: 'If genuinely duplicated, the same fact can drift out of sync across files.',
      suggested_action:
        'Semantic review: compare the sections; if one restates the other, keep a single reference location and link the rest. Preserve layer separation.',
      requires_semantic_review: true,
    })
  }

  // --- B. Unincorporated learning candidates (SEMANTIC — flagged) ---
  for (const la of scoped) {
    if (!isCompletedWorkItem(la)) continue
    const learning = sectionBody(la.body, ['Learning', 'Aprendizaje', 'Aprendizajes', 'Learnings'])
    if (!learning) continue
    if (!looksLikeDurableRule(learning)) continue
    opportunities.push({
      id: stableOpportunityId('unincorporated_learning', [label(la)]),
      category: 'unincorporated_learning',
      classification: 'suggested',
      confidence: 'requires-review',
      title: `${label(la)} captured a learning that may belong in current knowledge`,
      source_artifacts: [label(la)],
      target_artifacts: ['knowledge/tech/codebase.md'],
      evidence: [`Completed Work Item records a rule-like learning: "${firstSentence(learning)}"`],
      rationale:
        'A learning phrased as a durable rule MAY represent live technical knowledge not yet reflected in Tech Knowledge. This is a candidate, not a confirmed gap.',
      possible_impact: 'A relevant constraint stays buried in delivery history instead of informing current work.',
      suggested_action:
        'Semantic review: decide whether this learning is a live rule; if so, incorporate it into the right Tech artifact WITH a reference back to the Work Item. Do not delete or summarize the Work Item.',
      requires_semantic_review: true,
    })
  }

  // --- F / C. Knowledge organization + fragmentation (quality is observed; action is review) ---
  const weakByFolder = new Map<string, LoadedArtifact[]>()
  for (const la of scoped) {
    const quality = safeQuality(dir, la.rel)
    if (quality === 'placeholder' || quality === 'weak') {
      opportunities.push({
        id: stableOpportunityId('knowledge_organization', [la.rel]),
        category: 'knowledge_organization',
        classification: 'observed',
        confidence: 'requires-review',
        title: `${label(la)} is ${quality} and may need consolidation or expansion`,
        source_artifacts: [label(la)],
        target_artifacts: [label(la)],
        evidence: [`Artifact quality analysis classifies this artifact as "${quality}".`],
        rationale:
          'Low-signal artifacts reduce retrieval quality. This is an observed quality signal, not a judgement that the content is wrong.',
        possible_impact: 'Readers must open more files to assemble a complete picture.',
        suggested_action: 'Review whether to expand, merge into a stronger artifact, or cross-reference it.',
        requires_semantic_review: false,
      })
      const folder = la.rel.split('/').slice(0, -1).join('/')
      const arr = weakByFolder.get(folder) ?? []
      arr.push(la)
      weakByFolder.set(folder, arr)
    }
  }
  for (const [folder, arts] of weakByFolder) {
    if (arts.length < 3) continue
    opportunities.push({
      id: stableOpportunityId('knowledge_fragmentation', arts.map((a) => a.rel)),
      category: 'knowledge_fragmentation',
      classification: 'suggested',
      confidence: 'requires-review',
      title: `${folder}/ holds ${arts.length} low-signal artifacts — possible fragmentation`,
      source_artifacts: arts.map((a) => label(a)),
      target_artifacts: [folder],
      evidence: [`${arts.length} placeholder/weak artifacts in the same folder: ${arts.map((a) => a.rel.split('/').pop()).join(', ')}.`],
      rationale:
        'Several thin artifacts in one folder MAY be easier to consume if consolidated or cross-linked. Consolidation must preserve each distinct responsibility.',
      possible_impact: 'Related knowledge is spread across too many files to follow.',
      suggested_action: 'Semantic review: evaluate whether cross-references or a consolidation would add clarity. Do not merge by file count alone.',
      requires_semantic_review: true,
    })
  }

  // Deterministic order: by category (fixed), then by id, so runs are reproducible (idempotency).
  opportunities.sort((x, y) => {
    const ci = CONSOLIDATION_CATEGORIES.indexOf(x.category) - CONSOLIDATION_CATEGORIES.indexOf(y.category)
    return ci !== 0 ? ci : x.id.localeCompare(y.id)
  })
  // De-duplicate by id (a pair could be reached twice).
  const seen = new Set<string>()
  const deduped = opportunities.filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true)))

  const layers = discoverLayers(dir)
  const layersEvaluated = scope.kind === 'layer' ? [scope.layer] : layers.map((l) => l.layer)
  const workItemsEvaluated = scoped.filter(isWorkItem).length

  const sourceFiles: ConsolidationSourceFile[] = [...scopedRels]
    .sort()
    .map((rel) => ({ path: rel, hash: sha256(readFileSafe(join(dir, rel))) }))

  const byCategory = Object.fromEntries(
    CONSOLIDATION_CATEGORIES.map((c) => [c, deduped.filter((o) => o.category === c).length])
  ) as Record<ConsolidationCategory, number>

  return {
    generated_at: now.toISOString(),
    scope: describeScope(scope),
    project_context: reportingProjectContext(dir),
    coverage: {
      scope: describeScope(scope),
      layers_evaluated: layersEvaluated,
      artifacts_evaluated: scoped.length,
      work_items_evaluated: workItemsEvaluated,
      excluded_sources: scope.kind === 'all' ? [] : [...loaded.map((l) => l.rel)].filter((r) => !scopedRels.has(r)).sort(),
    },
    source_files: sourceFiles,
    opportunities: deduped,
    summary: {
      total: deduped.length,
      by_category: byCategory,
      requires_semantic_review: deduped.filter((o) => o.requires_semantic_review).length,
    },
  }
}

// ---------------------------------------------------------------------------
// Staleness (AC-14): a plan can be checked against the current files.
// ---------------------------------------------------------------------------

export type StalenessResult = { stale: boolean; changed: string[]; removed: string[] }

/** Re-read the plan's source files and report which changed or were removed since generation. */
export function consolidationPlanStaleness(dir: string, plan: ConsolidationPlan): StalenessResult {
  const changed: string[] = []
  const removed: string[] = []
  for (const sf of plan.source_files) {
    const abs = join(dir, sf.path)
    if (!exists(abs)) {
      removed.push(sf.path)
      continue
    }
    if (sha256(readFileSafe(abs)) !== sf.hash) changed.push(sf.path)
  }
  return { stale: changed.length > 0 || removed.length > 0, changed, removed }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<ConsolidationCategory, string> = {
  knowledge_redundancy: 'Possible redundancy',
  unincorporated_learning: 'Learning integration opportunity',
  knowledge_fragmentation: 'Possible fragmentation',
  relationship_opportunity: 'Relationship review hint',
  potentially_outdated: 'Potential inconsistency',
  knowledge_organization: 'Organization opportunity',
}

export function renderConsolidationMarkdown(plan: ConsolidationPlan): string {
  const lines: string[] = []
  lines.push('# Knowledge Consolidation Plan')
  lines.push('')
  lines.push('> Derived, review-only projection. No canonical knowledge was modified by this analysis.')
  lines.push('')
  lines.push(`- Generated at: ${plan.generated_at}`)
  lines.push(`- Scope: ${plan.scope}`)
  lines.push(`- Project: state=${plan.project_context.state}, mode=${plan.project_context.mode}, structure=${plan.project_context.repository_structure}`)
  lines.push('')
  lines.push('## Coverage')
  lines.push('')
  lines.push(`- Layers evaluated: ${plan.coverage.layers_evaluated.join(', ') || '—'}`)
  lines.push(`- Artifacts evaluated: ${plan.coverage.artifacts_evaluated}`)
  lines.push(`- Work Items evaluated: ${plan.coverage.work_items_evaluated}`)
  if (plan.coverage.excluded_sources.length > 0) {
    lines.push(`- Excluded from this scope: ${plan.coverage.excluded_sources.length} artifact(s)`)
  }
  lines.push('')
  lines.push('## Findings')
  lines.push('')
  if (plan.summary.total === 0) {
    lines.push('No consolidation opportunities were detected by the available deterministic analyses within this scope.')
    lines.push('')
    lines.push('This is not a claim that the knowledge is perfect — only that no opportunity was found with the current signals.')
    lines.push('')
    return lines.join('\n') + '\n'
  }
  for (const cat of CONSOLIDATION_CATEGORIES) {
    const n = plan.summary.by_category[cat]
    if (n > 0) lines.push(`- ${n} × ${CATEGORY_LABELS[cat]}`)
  }
  lines.push('')
  lines.push(`${plan.summary.requires_semantic_review} finding(s) require semantic (agent/human) review before acting.`)
  lines.push('')
  lines.push('## Opportunities')
  lines.push('')
  for (const o of plan.opportunities) {
    lines.push(`### ${o.title}`)
    lines.push('')
    lines.push(`- Id: \`${o.id}\``)
    lines.push(`- Category: ${o.category}`)
    lines.push(`- Classification: **${o.classification}**${o.requires_semantic_review ? ' (requires semantic review)' : ''}`)
    lines.push(`- Confidence: ${o.confidence}`)
    lines.push(`- Source: ${o.source_artifacts.join(', ') || '—'}`)
    lines.push(`- Suggested target: ${o.target_artifacts.join(', ') || '—'}`)
    lines.push(`- Evidence:`)
    for (const e of o.evidence) lines.push(`  - ${e}`)
    lines.push(`- Rationale: ${o.rationale}`)
    lines.push(`- Possible impact: ${o.possible_impact}`)
    lines.push(`- Suggested action: ${o.suggested_action}`)
    lines.push('')
  }
  return lines.join('\n') + '\n'
}

export function serializeConsolidationJson(plan: ConsolidationPlan): string {
  return JSON.stringify(plan, null, 2) + '\n'
}

// ---------------------------------------------------------------------------
// Internal predicates / small readers
// ---------------------------------------------------------------------------

function describeScope(scope: ConsolidationScope): string {
  if (scope.kind === 'all') return 'all'
  if (scope.kind === 'layer') return `layer:${scope.layer}`
  return `module:${scope.module}`
}

function isWorkItem(la: LoadedArtifact): boolean {
  return toPosix(la.artifact.filePath).includes('/delivery/work-items/')
}

function isCompletedWorkItem(la: LoadedArtifact): boolean {
  const p = toPosix(la.artifact.filePath)
  return p.includes('/delivery/work-items/completed/') || (isWorkItem(la) && la.artifact.status === 'completed')
}

function looksLikeDurableRule(text: string): boolean {
  const lower = text.toLowerCase()
  return RULE_KEYWORDS.some((k) => new RegExp(`(^|[^a-záéíóúñ])${k}([^a-záéíóúñ]|$)`, 'i').test(lower))
}

function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  const m = flat.match(/^(.{0,200}?[.!?])(\s|$)/)
  const s = (m ? m[1] : flat).slice(0, 200)
  return redactSecrets(s.trim())
}

/**
 * Mask secret-looking tokens before they can reach the plan's evidence text (AC-16). The analysis
 * only reads knowledge, which should never contain secrets, but a hand-authored learning might — so
 * we redact common secret shapes defensively rather than echo them.
 */
const SECRET_TOKEN_PATTERNS: RegExp[] = [
  /\bgh[pours]_[A-Za-z0-9]{16,}\b/g, // GitHub tokens
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, // AWS access key ids
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, // Slack tokens
  /\bsk-[A-Za-z0-9]{16,}\b/g, // OpenAI-style keys
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, // JWTs
  /\b[A-Za-z0-9+/]{40,}={0,2}\b/g, // long base64 / opaque blobs
]

function redactSecrets(text: string): string {
  let out = text
  for (const re of SECRET_TOKEN_PATTERNS) out = out.replace(re, '[redacted]')
  return out
}

function safeQuality(dir: string, rel: string): ArtifactQuality {
  try {
    return analyzeKnowledgeArtifact(dir, rel)
  } catch {
    return 'useful'
  }
}

function readFileSafe(abs: string): string {
  try {
    return readFile(abs)
  } catch {
    return ''
  }
}

function decisionFileExists(dir: string, decisionId: string): boolean {
  const decisionsDir = join(dir, KNOWLEDGE, 'tech', 'decisions')
  if (!exists(decisionsDir)) return false
  try {
    return readDir(decisionsDir).some((e) => {
      const full = join(decisionsDir, e)
      if (!isFile(full) || !e.endsWith('.md')) return false
      return e.toLowerCase().includes(decisionId.toLowerCase())
    })
  } catch {
    return false
  }
}

function hintInScope(hint: GraphHint, scoped: LoadedArtifact[]): boolean {
  if (scoped.length === 0) return false
  // A hint is in scope when its artifact is among the scoped set (by id or path).
  return scoped.some(
    (la) => la.artifact.id === hint.artifact_id || (hint.path && toPosix(la.artifact.filePath).endsWith(toPosix(hint.path)))
  )
}

function relationshipOpportunityFromHint(hint: GraphHint): ConsolidationOpportunity {
  const finding = graphHintFinding(hint)
  return {
    id: stableOpportunityId('relationship_opportunity', [hint.artifact_id, ...hint.missing]),
    category: 'relationship_opportunity',
    classification: 'observed',
    confidence: 'requires-review',
    title: hint.message,
    source_artifacts: [hint.artifact_id],
    target_artifacts: [hint.artifact_id],
    evidence: [finding.evidence],
    rationale:
      'A missing OPTIONAL relationship is an opportunity to review, not an error or a verified inconsistency. Kaddo never invents the relationship.',
    possible_impact: 'Weaker traceability in the knowledge graph.',
    suggested_action: finding.suggested_action,
    requires_semantic_review: false,
  }
}
