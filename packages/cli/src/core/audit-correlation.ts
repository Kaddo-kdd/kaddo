// WI-094 (EP-001 / INI-001, candidate AUD-C6) — the Correlate step of the audit flow: contrast each finding
// against the project's documented knowledge (ADRs, capabilities, Work Items, ownership and risks) and enrich
// it with references and advisory context. Deterministic metadata matching (module / path / domain), not NLP.
//
// Read-only and advisory: it never writes knowledge, never creates relations, never asserts causality, and
// never changes a finding's severity, confidence or status. It does NOT modify the frozen AuditFinding
// contract (WI-090) — it returns a CorrelatedFinding (finding + correlation). A match declares its strength;
// a domain match is a suggestion, not a confirmed link. A finding with no matches gets empty references and
// an explicit "no correlation" note — never a fabricated link. The concrete "relate to a Work Item + dedup
// with approval" planning action is AUD-C10, not here.

import { minimatch } from 'minimatch'
import { resolveAffectedOwners, type DomainOwners, type OwnerMatch } from '../services/owners.js'
import type { AuditFinding } from './audit.js'
import type { KnowledgeArtifact } from '../services/knowledge-artifacts.js'

export type MatchStrength = 'exact' | 'module' | 'domain' | 'none'

export type FindingCorrelation = {
  /** Resolved ownership for the finding's area (advisory context). */
  owners: OwnerMatch[]
  /** Ids of documented risk artifacts related to the finding's area. */
  risks: string[]
  /** Strongest match found: exact (file glob) > module > domain > none. */
  matchStrength: MatchStrength
  /** Human-readable, advisory notes — never an assertion of causality. */
  notes: string[]
}

/** A finding plus its correlation. The base AuditFinding (WI-090) is unchanged. */
export type CorrelatedFinding = AuditFinding & { correlation: FindingCorrelation }

export type DiscoveredModuleRef = { name: string; path: string }

export type CorrelateInput = {
  findings: AuditFinding[]
  artifacts: KnowledgeArtifact[]
  owners?: DomainOwners
  /** Workspace modules (from Discover, WI-091) used to resolve a finding's module from its file. */
  modules?: DiscoveredModuleRef[]
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

function uniqSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort()
}

/** Resolve the module a file belongs to: the module whose path is the longest prefix of the file. */
function resolveModule(file: string | undefined, modules: DiscoveredModuleRef[]): string | null {
  if (!file) return null
  const f = toPosix(file)
  let best: DiscoveredModuleRef | null = null
  for (const m of modules) {
    const base = toPosix(m.path).replace(/\/+$/, '')
    if (f === base || f.startsWith(base + '/')) {
      if (!best || base.length > toPosix(best.path).length) best = m
    }
  }
  return best ? best.name : null
}

function isAdr(a: KnowledgeArtifact): boolean {
  const t = a.type.toLowerCase()
  return t === 'decision' || t === 'adr'
}

function isRisk(a: KnowledgeArtifact): boolean {
  return a.type.toLowerCase() === 'risk'
}

type Match = { artifact: KnowledgeArtifact; strength: Exclude<MatchStrength, 'none'> }

/** Does an artifact match this finding, and how strongly? Exact (file glob) beats module beats domain. */
function matchArtifact(artifact: KnowledgeArtifact, file: string | null, moduleId: string | null): Match | null {
  if (file && artifact.codeGlobs.some((g) => minimatch(file, g, { matchBase: false, dot: true }))) {
    return { artifact, strength: 'exact' }
  }
  if (moduleId && artifact.affectedModules.includes(moduleId)) {
    return { artifact, strength: 'module' }
  }
  return null
}

const STRENGTH_RANK: Record<MatchStrength, number> = { exact: 3, module: 2, domain: 1, none: 0 }

/**
 * Correlate findings with the project's knowledge. Pure and deterministic: it does not mutate its inputs,
 * builds new finding objects, and leaves severity/confidence/status untouched — only populating references
 * and the correlation context.
 */
export function correlateFindings(input: CorrelateInput): CorrelatedFinding[] {
  const modules = input.modules ?? []
  const owners = input.owners ?? {}

  return input.findings.map((finding) => {
    const file = finding.location?.file ? toPosix(finding.location.file) : null
    const moduleId = resolveModule(file ?? undefined, modules)

    const matches: Match[] = []
    for (const artifact of input.artifacts) {
      const m = matchArtifact(artifact, file, moduleId)
      if (m) matches.push(m)
    }

    const workItems = uniqSorted(matches.filter((m) => m.artifact.isWorkItem).map((m) => m.artifact.id))
    const adrs = uniqSorted(matches.filter((m) => isAdr(m.artifact)).map((m) => m.artifact.id))
    const capabilities = uniqSorted(matches.flatMap((m) => m.artifact.capabilities))
    const risks = uniqSorted(matches.filter((m) => isRisk(m.artifact)).map((m) => m.artifact.id))

    // Owners resolved from the domains of the matched artifacts (advisory context).
    const matchedDomains = uniqSorted(matches.flatMap((m) => m.artifact.domains))
    const resolvedOwners = resolveAffectedOwners(matchedDomains, owners)

    // Strength: strongest artifact match; domain-only when owners resolved but no artifact matched; else none.
    let matchStrength: MatchStrength = 'none'
    for (const m of matches) if (STRENGTH_RANK[m.strength] > STRENGTH_RANK[matchStrength]) matchStrength = m.strength
    if (matchStrength === 'none' && resolvedOwners.length > 0) matchStrength = 'domain'

    const notes: string[] = []
    if (matchStrength === 'none') {
      notes.push('No correlation found in project knowledge.')
    } else {
      if (workItems.length > 0) notes.push(`Related Work Items: ${workItems.join(', ')} (${matchStrength} match).`)
      if (adrs.length > 0) notes.push(`Governing ADRs: ${adrs.join(', ')}.`)
      if (risks.length > 0) notes.push(`Documented risks: ${risks.join(', ')}.`)
      if (resolvedOwners.length > 0) notes.push(`Owners: ${resolvedOwners.map((o) => `${o.domain} → ${o.owners.join('/')}`).join('; ')}.`)
    }

    // Merge with any references the finding already carried; never mutate the original.
    const mergedReferences = {
      adrs: uniqSorted([...(finding.references.adrs ?? []), ...adrs]),
      capabilities: uniqSorted([...(finding.references.capabilities ?? []), ...capabilities]),
      workItems: uniqSorted([...(finding.references.workItems ?? []), ...workItems]),
    }

    return {
      ...finding,
      references: mergedReferences,
      correlation: { owners: resolvedOwners, risks, matchStrength, notes },
    }
  })
}
