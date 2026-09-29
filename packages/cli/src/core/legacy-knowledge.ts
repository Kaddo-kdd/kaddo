// Legacy knowledge detection (WI-012).
//
// Helpers to check whether a project has legacy analysis artifacts. Used by refinement,
// handoff, and guard to inject legacy-aware context when relevant. Never generates or
// modifies knowledge — read-only.

import { exists, join, readFile } from '../utils/fs.js'

const LEGACY_DIR = 'knowledge/legacy'
const RISKS_PATH = 'knowledge/legacy/risks.md'
const UNKNOWNS_PATH = 'knowledge/legacy/unknowns.md'
const CANDIDATES_PATH = 'knowledge/legacy/modernization-candidates.md'

/** True when at least one legacy analysis artifact exists. */
export function hasLegacyKnowledge(dir: string): boolean {
  return (
    exists(join(dir, RISKS_PATH)) ||
    exists(join(dir, UNKNOWNS_PATH)) ||
    exists(join(dir, CANDIDATES_PATH))
  )
}

export type LegacyArtifact = {
  path: string
  exists: boolean
  identifiers: string[]
}

export type LegacyKnowledgeSummary = {
  available: boolean
  risks: LegacyArtifact
  unknowns: LegacyArtifact
  candidates: LegacyArtifact
}

const ID_PATTERN = /^##\s+(RISK-\d+|UNK-\d+|MOD-\d+)/gm

function extractIdentifiers(content: string, prefix: string): string[] {
  const ids: string[] = []
  for (const m of content.matchAll(ID_PATTERN)) {
    if (m[1].startsWith(prefix)) ids.push(m[1])
  }
  return ids
}

function readArtifact(dir: string, rel: string, prefix: string): LegacyArtifact {
  const abs = join(dir, rel)
  if (!exists(abs)) return { path: rel, exists: false, identifiers: [] }
  const content = readFile(abs)
  return { path: rel, exists: true, identifiers: extractIdentifiers(content, prefix) }
}

/** Read all legacy analysis artifacts and extract their identifiers. */
export function getLegacyKnowledgeSummary(dir: string): LegacyKnowledgeSummary {
  const risks = readArtifact(dir, RISKS_PATH, 'RISK-')
  const unknowns = readArtifact(dir, UNKNOWNS_PATH, 'UNK-')
  const candidates = readArtifact(dir, CANDIDATES_PATH, 'MOD-')
  return {
    available: risks.exists || unknowns.exists || candidates.exists,
    risks,
    unknowns,
    candidates,
  }
}
