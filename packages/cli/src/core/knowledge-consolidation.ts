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

// --- Redundancy: content-based overlap (never heading-based) ---------------
//
// Sharing section titles (Decision/Consequences in ADRs, Expected value/Success criteria in
// Initiatives) comes from a shared template and is NOT evidence of duplication. Redundancy is
// therefore detected from DISTINCTIVE CONTENT: overlapping word-shingles of the prose body, with
// headings, code blocks, list markers and block quotes stripped out.

/** Shingle length (consecutive content words). Long enough that template boilerplate rarely collides. */
const SHINGLE_SIZE = 6
/**
 * Minimum length of a CONTIGUOUS shared shingle run before two artifacts are a redundancy candidate.
 * A run of N shingles means a shared passage of `SHINGLE_SIZE + N - 1` consecutive words. Requiring a
 * contiguous run (not scattered matches) is what separates a genuinely duplicated passage from the
 * handful of short boilerplate phrases two template-based ADRs/Initiatives inevitably share.
 */
const MIN_SHARED_RUN = 6 // ≈ an 11+ word passage repeated verbatim

/** Prose words of a markdown body, excluding headings, fenced code, block quotes and list markers. */
function contentWords(body: string): string[] {
  const words: string[] = []
  let inFence = false
  for (const raw of body.split(/\r?\n/)) {
    const t = raw.trim()
    if (/^```/.test(t)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    if (/^#{1,6}\s/.test(t)) continue // heading
    if (/^>/.test(t)) continue // block quote
    // strip leading list / numbering markers but keep the text
    const text = t.replace(/^([-*+]\s+|\d+\.\s+)/, '')
    const matched = text.toLowerCase().match(/[a-záéíóúñü0-9]+/gi)
    if (matched) words.push(...matched)
  }
  return words
}

type Shingles = { words: string[]; keys: string[]; set: Set<string> }

/** Ordered content shingles of a body plus a membership set, for contiguous-overlap detection. */
function buildShingles(body: string): Shingles {
  const words = contentWords(body)
  const keys: string[] = []
  const set = new Set<string>()
  for (let i = 0; i + SHINGLE_SIZE <= words.length; i++) {
    const key = words.slice(i, i + SHINGLE_SIZE).join(' ')
    keys.push(key)
    set.add(key)
  }
  return { words, keys, set }
}

/**
 * Longest run of A's consecutive shingles that are all present in B, and the readable snippet of that
 * run. A long run means a verbatim passage was repeated; scattered template phrases yield runs of 1-2.
 */
function longestSharedRun(a: Shingles, b: Shingles): { length: number; snippet: string } {
  let best = 0
  let bestStart = -1
  let run = 0
  let runStart = 0
  for (let i = 0; i < a.keys.length; i++) {
    if (b.set.has(a.keys[i])) {
      if (run === 0) runStart = i
      run += 1
      if (run > best) {
        best = run
        bestStart = runStart
      }
    } else {
      run = 0
    }
  }
  if (best === 0) return { length: 0, snippet: '' }
  const snippet = a.words.slice(bestStart, bestStart + SHINGLE_SIZE + best - 1).join(' ')
  return { length: best, snippet }
}

// --- Learning classification (deterministic heuristic, never asserted as truth) ----------------
//
// A completed Work Item's learning may encode a durable rule OR merely record a historical result,
// a benchmark, a test observation or an experiment. Only a sentence that reads as a normative rule
// becomes a candidate, and the exact triggering sentence is kept as evidence.

export type LearningKind =
  | 'durable-rule'
  | 'historical-result'
  | 'benchmark-evidence'
  | 'test-observation'
  | 'experimental-result'
  | 'none'

// STRONG normative signals only (modal verbs / rule nouns). Bare `never/always/nunca/siempre` are
// deliberately excluded: they read as past-tense narration as often as rules ("it never rendered"),
// and treating them as rules produced false positives. A real rule here carries a modal or a rule noun.
const NORMATIVE_RE =
  /(^|[^a-záéíóúñü])(must|should|shall|debe[ns]?|deber[ií]a[ns]?|se\s+debe|hay\s+que|requiere[ns]?|require[sd]?|no\s+debe|invariant[e]?|invariants|restricci[oó]n|constraint|regla|obligatori[oa])([^a-záéíóúñü]|$)/i
const PAST_RESULT_RE =
  /(compil[aoeéó]\w*|compiled|benchmark\w*|passed|succeed\w*|succeeded|ran\s+successfully|ejecut\w*|resultad\w*|crates?\b|ns\/op|µs\b|throughput|latenc\w*|baseline|measured|medid\w*|\d+\s*%|\bx\d|faster|slower)/i
const TEST_RE = /(\btest\w*|\bpruebas?\b|coverage|cobertura|verde[s]?|green\b|assert\w*)/i
const BENCH_RE = /(benchmark\w*|ns\/op|µs\b|throughput|latenc\w*|ops\/s|\d+\s*%|faster|slower|baseline)/i
const EXPERIMENT_RE = /(experiment\w*|experiment[oa]\w*|prototyp\w*|prototip\w*|spike\b|probamos|probé|intentamos)/i

/** Split a block of prose into sentences (keeps it simple and deterministic). */
function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Classify one learning sentence. A durable rule needs normative phrasing not dominated by a result. */
export function classifyLearningSentence(sentence: string): LearningKind {
  const s = sentence.trim()
  if (!s) return 'none'
  const normative = NORMATIVE_RE.test(s)
  const pastResult = PAST_RESULT_RE.test(s)
  // A normative modal/term that is not merely narrating a past result is a durable-rule candidate.
  if (normative && !pastResult) return 'durable-rule'
  if (BENCH_RE.test(s)) return 'benchmark-evidence'
  if (pastResult) return 'historical-result'
  if (TEST_RE.test(s)) return 'test-observation'
  if (EXPERIMENT_RE.test(s)) return 'experimental-result'
  return 'none'
}

/** The first sentence of a learning that reads as a durable rule, or null. */
function firstRuleFragment(learning: string): string | null {
  for (const sentence of splitSentences(learning)) {
    if (classifyLearningSentence(sentence) === 'durable-rule') return sentence
  }
  return null
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
  // Compared across all comparable knowledge (layer docs, ADRs and Initiatives included), but NOT
  // Work Items, the roadmap, or reusable scaffolding (agents/skills/external capsules). The signal is
  // DISTINCTIVE CONTENT overlap (shared word-shingles of the prose), never shared section titles — so
  // two ADRs or two Initiatives built from the same template do not become a candidate on structure
  // alone, while two documents that actually restate the same passage still do.
  const comparable = scoped.filter(isComparableKnowledge)
  const shingleIndex = new Map<string, LoadedArtifact[]>()
  const shinglesByRel = new Map<string, Shingles>()
  for (const la of comparable) {
    const shingles = buildShingles(la.body)
    shinglesByRel.set(la.rel, shingles)
    for (const key of shingles.set) {
      const arr = shingleIndex.get(key) ?? []
      arr.push(la)
      shingleIndex.set(key, arr)
    }
  }
  // Candidate pairs share at least one shingle; a real overlap is then confirmed by a contiguous run.
  const candidatePairs = new Map<string, { a: LoadedArtifact; b: LoadedArtifact }>()
  for (const arts of shingleIndex.values()) {
    if (arts.length < 2) continue
    for (let i = 0; i < arts.length; i++) {
      for (let j = i + 1; j < arts.length; j++) {
        if (arts[i].rel === arts[j].rel) continue
        const key = [arts[i].rel, arts[j].rel].sort().join('||')
        if (!candidatePairs.has(key)) candidatePairs.set(key, { a: arts[i], b: arts[j] })
      }
    }
  }
  for (const { a, b } of candidatePairs.values()) {
    const run = longestSharedRun(shinglesByRel.get(a.rel)!, shinglesByRel.get(b.rel)!)
    if (run.length < MIN_SHARED_RUN) continue // only a contiguous verbatim passage, not template phrases
    const passageWords = SHINGLE_SIZE + run.length - 1
    opportunities.push({
      id: stableOpportunityId('knowledge_redundancy', [label(a), label(b)]),
      category: 'knowledge_redundancy',
      classification: 'suggested',
      confidence: 'requires-review',
      title: `Possible overlapping content between ${label(a)} and ${label(b)}`,
      source_artifacts: [label(a), label(b)],
      target_artifacts: [label(a), label(b)],
      evidence: [
        `A ${passageWords}-word passage appears verbatim in both artifacts: "${redactSecrets(run.snippet)}".`,
      ],
      rationale:
        'A verbatim shared passage is a hint of potential duplication, NOT proof. Two documents can legitimately restate context from different layers/responsibilities; shared template structure alone was NOT used.',
      possible_impact: 'If genuinely duplicated, the same fact can drift out of sync across files.',
      suggested_action:
        'Semantic review: compare the overlapping passage; if one restates the other, keep a single reference location and link the rest. Preserve layer separation.',
      requires_semantic_review: true,
    })
  }

  // --- B. Unincorporated learning candidates (SEMANTIC — flagged) ---
  // A candidate requires a specific sentence that reads as a durable RULE — historical results,
  // benchmarks, test observations and experiment outcomes do not qualify. The triggering sentence
  // (not the section's opening) is kept as evidence. The destination is left UNRESOLVED: Core cannot
  // justify a concrete target artifact, so it delegates that to semantic review (no generic codebase.md).
  for (const la of scoped) {
    if (!isCompletedWorkItem(la)) continue
    const learning = sectionBody(la.body, ['Learning', 'Aprendizaje', 'Aprendizajes', 'Learnings'])
    if (!learning) continue
    const ruleFragment = firstRuleFragment(learning)
    if (!ruleFragment) continue
    opportunities.push({
      id: stableOpportunityId('unincorporated_learning', [label(la)]),
      category: 'unincorporated_learning',
      classification: 'suggested',
      confidence: 'requires-review',
      title: `${label(la)} captured a learning that may belong in current knowledge`,
      source_artifacts: [label(la)],
      target_artifacts: [], // unresolved — determined in semantic review (never invent a destination)
      evidence: [`Completed Work Item records a rule-like learning (heuristic classification): "${redactSecrets(ruleFragment)}"`],
      rationale:
        'A sentence phrased as a durable rule MAY represent live technical knowledge not yet reflected in current knowledge. The rule/result distinction is a heuristic, not a verified conclusion — this is a candidate, not a confirmed gap.',
      possible_impact: 'A relevant constraint stays buried in delivery history instead of informing current work.',
      suggested_action:
        'Semantic review: confirm whether this is a live rule and determine the right destination artifact; if so, incorporate it WITH a reference back to the Work Item. Do not delete or summarize the Work Item.',
      requires_semantic_review: true,
    })
  }

  // --- F / C. Knowledge organization + fragmentation ---
  // Quality is only an organization opportunity for CONSOLIDATABLE canonical knowledge docs
  // (Business/Product/Tech layer docs, ADRs included). Work Items (independent, historical units of
  // traceability), the roadmap, initiatives, deprecations, generated inventories/indexes and
  // agent/skill scaffolding are excluded: being short or weak there is expected, not an opportunity.
  // The quality signal is `observed`; whether to expand/merge needs judgement → requires_semantic_review.
  const weakByFolder = new Map<string, LoadedArtifact[]>()
  for (const la of scoped) {
    if (!isConsolidatableKnowledge(la)) continue
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
        evidence: [`Artifact quality analysis classifies this canonical knowledge artifact as "${quality}".`],
        rationale:
          'Observed: the quality heuristic rates this artifact low-signal. Whether it should be expanded, merged or cross-referenced is a judgement that needs semantic review — the quality signal alone does not decide it.',
        possible_impact: 'Readers must open more files to assemble a complete picture.',
        suggested_action: 'Semantic review: decide whether to expand, merge into a stronger artifact, or cross-reference it.',
        requires_semantic_review: true,
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
      title: `${folder}/ holds ${arts.length} low-signal canonical artifacts — possible fragmentation`,
      source_artifacts: arts.map((a) => label(a)),
      target_artifacts: [folder],
      evidence: [`${arts.length} placeholder/weak canonical knowledge artifacts in the same folder: ${arts.map((a) => a.rel.split('/').pop()).join(', ')}.`],
      rationale:
        'Several thin canonical artifacts in one folder MAY be easier to consume if consolidated or cross-linked. Consolidation must preserve each distinct responsibility; Work Items and generated/lifecycle artifacts are not considered here.',
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
    lines.push(
      `- Suggested target: ${o.target_artifacts.length > 0 ? o.target_artifacts.join(', ') : '(unresolved — to be determined in semantic review)'}`
    )
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

/** Reusable scaffolding (agent/skill prompts, external capsules) — shares templates by design. */
function isScaffolding(la: LoadedArtifact): boolean {
  const p = toPosix(la.artifact.filePath)
  return (
    p.includes(`/${KNOWLEDGE}/agents/`) ||
    p.includes(`/${KNOWLEDGE}/skills/`) ||
    p.includes(`/${KNOWLEDGE}/external/`) ||
    la.artifact.type === 'knowledge-capsule'
  )
}

/** Lifecycle/generated artifact types that are not canonical knowledge docs to organize. */
const NON_KNOWLEDGE_DOC_TYPES = new Set([
  'roadmap',
  'initiative',
  'deprecation',
  'knowledge-capsule',
  'inventory',
  'project-resource',
])

/**
 * Artifacts eligible for REDUNDANCY comparison: any knowledge document a human authored as content —
 * layer docs, ADRs and Initiatives included — but not Work Items, the roadmap, or scaffolding.
 */
function isComparableKnowledge(la: LoadedArtifact): boolean {
  return !isWorkItem(la) && la.artifact.type !== 'roadmap' && !isScaffolding(la)
}

/**
 * Artifacts eligible for ORGANIZATION/FRAGMENTATION: canonical Business/Product/Tech knowledge docs
 * (ADRs included). Excludes Work Items, Delivery lifecycle artifacts, generated inventories/indexes
 * (layer null) and scaffolding — being short/weak there is expected, not an opportunity.
 */
function isConsolidatableKnowledge(la: LoadedArtifact): boolean {
  if (isWorkItem(la) || isScaffolding(la)) return false
  if (NON_KNOWLEDGE_DOC_TYPES.has(la.artifact.type)) return false
  return la.layer === 'Business' || la.layer === 'Product' || la.layer === 'Tech'
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
