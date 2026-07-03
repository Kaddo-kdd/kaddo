// Tech decisions: decision candidates → ADRs (VS-075).
//
// Deterministic detection of technical decision candidates (knowledge/tech/decision-candidates.md)
// and materialized ADRs (knowledge/tech/decisions/). Surfaces a readiness signal and a handoff so the
// user materializes candidates into ADR drafts (via the adr-writing skill) before implementing
// affected Work Items. Read-only: no LLM, no git, never writes/decides.

import { exists, readFile, readDir, isFile, join } from '../utils/fs.js'

// Discovery is the preferred home for decision candidates (VS-075.2); the legacy root path is a
// backward-compatible fallback.
const CANDIDATES_DISCOVERY = 'knowledge/tech/discovery/decision-candidates.md'
const CANDIDATES_LEGACY = 'knowledge/tech/decision-candidates.md'
const DECISIONS_DIR = 'knowledge/tech/decisions'

/** Resolve the decision-candidates file: prefer discovery/, fall back to the legacy root location. */
export function resolveCandidatesPath(dir: string): { path: string | null; legacy: boolean; bothExist: boolean } {
  const discovery = exists(join(dir, CANDIDATES_DISCOVERY))
  const legacy = exists(join(dir, CANDIDATES_LEGACY))
  if (discovery) return { path: CANDIDATES_DISCOVERY, legacy: false, bothExist: legacy }
  if (legacy) return { path: CANDIDATES_LEGACY, legacy: true, bothExist: false }
  return { path: null, legacy: false, bothExist: false }
}

export type TechDecisionsStatus = 'none' | 'candidates' | 'draft-adrs' | 'accepted-adrs'

export type DecisionCandidate = { title: string; source: string; suggestedAdrFile: string }

export type TechDecisions = {
  status: TechDecisionsStatus
  candidates: number
  adrs: number
  draft_adrs: number
  accepted_adrs: number
  candidate_list: DecisionCandidate[]
  /** The decision-candidates file actually read (discovery/ or legacy root), or null (VS-075.2). */
  candidates_source: string | null
  /** True when the legacy root location was used instead of discovery/. */
  candidates_legacy_location: boolean
  /** True when both discovery/ and legacy files exist (discovery/ wins). */
  candidates_both_exist: boolean
}

/** Strip list/heading prefixes from a candidate title (e.g. `1.`, `2)`, `(3)`, `001.`, `-`, `##`). */
export function cleanCandidateTitle(title: string): string {
  return title
    .replace(/^\s*#{1,6}\s+/, '') // markdown heading
    .replace(/^\s*[-*]\s+/, '') // bullet
    .replace(/^\s*\(?\d+\)?[.):]\s+/, '') // 1. / 01. / 1) / (2) / 3:
    .trim()
}

/** Filename-safe slug: normalizes acronyms (INTERNAL_CRON_SECRET → internal-cron-secret), accents. */
function slugify(s: string): string {
  return cleanCandidateTitle(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-') // underscores, spaces, parens → single hyphen
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '')
}

/** Parse the `## <title>` decision headings from decision-candidates.md (H1 excluded). */
export function parseDecisionCandidates(md: string): string[] {
  const out: string[] = []
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^##\s+(.+?)\s*$/) // level-2 heading = one candidate decision
    if (m) {
      const raw = m[1].trim()
      if (!raw || /^_.*_$/.test(raw)) continue
      // Strip any numeric list prefix inside the heading (`## 1. Title` → `Title`) (VS-075.1).
      const t = cleanCandidateTitle(raw)
      if (t) out.push(t)
    }
  }
  return out
}

/** Count ADRs under knowledge/tech/decisions/ by front-matter status. */
function countAdrs(dir: string): { total: number; draft: number; accepted: number } {
  const base = join(dir, DECISIONS_DIR)
  if (!exists(base)) return { total: 0, draft: 0, accepted: 0 }
  let total = 0
  let draft = 0
  let accepted = 0
  for (const entry of readDir(base)) {
    if (!entry.endsWith('.md') || entry === '.gitkeep') continue
    const full = join(base, entry)
    if (!isFile(full)) continue
    total += 1
    let content = ''
    try {
      content = readFile(full)
    } catch {
      continue
    }
    const status = content.match(/^\s*status:\s*([a-z-]+)/im)?.[1]?.toLowerCase()
    if (status === 'accepted') accepted += 1
    else draft += 1 // draft / proposed / anything else counts as not-yet-accepted
  }
  return { total, draft, accepted }
}

/** Build the deterministic tech-decisions readiness snapshot for a project. */
export function buildTechDecisions(dir: string): TechDecisions {
  const resolved = resolveCandidatesPath(dir)
  let titles: string[] = []
  if (resolved.path) {
    try {
      titles = parseDecisionCandidates(readFile(join(dir, resolved.path)))
    } catch {
      titles = []
    }
  }
  const { total, draft, accepted } = countAdrs(dir)

  // Suggested ADR filenames continue numbering after existing ADRs.
  const candidate_list: DecisionCandidate[] = titles.map((title, i) => {
    const n = String(total + i + 1).padStart(3, '0')
    return { title, source: resolved.path!, suggestedAdrFile: `${DECISIONS_DIR}/ADR-${n}-${slugify(title)}.md` }
  })

  let status: TechDecisionsStatus
  if (accepted > 0) status = 'accepted-adrs'
  else if (total > 0) status = 'draft-adrs'
  else if (titles.length > 0) status = 'candidates'
  else status = 'none'

  return {
    status,
    candidates: titles.length,
    adrs: total,
    draft_adrs: draft,
    accepted_adrs: accepted,
    candidate_list,
    candidates_source: resolved.path,
    candidates_legacy_location: resolved.legacy,
    candidates_both_exist: resolved.bothExist,
  }
}

/** True when there are decision candidates but no ADRs yet — the actionable state. */
export function hasUnmaterializedDecisions(td: TechDecisions): boolean {
  return td.candidates > 0 && td.adrs === 0
}
