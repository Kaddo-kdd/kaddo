// Deterministic helpers for the Ownership Front Matter Assistant (VS-011).
//
// These functions help users declare `code:` ownership globs on knowledge artifacts so Guard
// Lite becomes useful. Everything here is deterministic — no LLM, no semantic inference. The
// CLI suggests candidates from scan signals + artifact metadata; the human confirms.

import matter from 'gray-matter'
import { exists, readFile, join } from '../utils/fs.js'
import { discoverWorkItems } from '../services/knowledge-artifacts.js'

const SCAN_PATH = '.kaddo/scan.json'

export type OwnershipArtifact = {
  /** Absolute path on disk. */
  filePath: string
  /** Path relative to the project root (POSIX-style). */
  relPath: string
  id: string
  title: string
  type: string
  domains: string[]
  capabilities: string[]
  codeGlobs: string[]
  source?: string
  /** True when the artifact already declares at least one `code:` glob. */
  hasOwnership: boolean
}

export type ScanSignals = {
  sourceDirectories: string[]
  migrationDirectories: string[]
  contractFiles: string[]
  infrastructureFiles: string[]
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : []
}

/** Parse a single artifact for ownership purposes. Returns null on unreadable front matter. */
export function parseOwnershipArtifact(
  filePath: string,
  relPath: string,
  raw: string
): OwnershipArtifact | null {
  try {
    const { data } = matter(raw)
    const codeGlobs = toStringArray(data.code)
    return {
      filePath,
      relPath: relPath.split('\\').join('/'),
      id: String(data.id ?? ''),
      title: String(data.title ?? ''),
      type: String(data.type ?? ''),
      domains: toStringArray(data.domains),
      capabilities: toStringArray(data.capabilities),
      codeGlobs,
      source: data.source ? String(data.source) : undefined,
      hasOwnership: codeGlobs.length > 0,
    }
  } catch {
    return null
  }
}

/**
 * Find Work Item artifacts via the unified discovery service (VS-046) — recursive across lifecycle
 * subfolders (draft/ready/in-progress/…), front-matter aware. This guarantees `owners suggest`
 * sees exactly the same Work Items as `explain`, `context` and `guard`.
 */
export function findWorkItemArtifacts(dir: string): OwnershipArtifact[] {
  return discoverWorkItems(dir).map((a) => ({
    filePath: a.filePath,
    relPath: a.relPath,
    id: a.id,
    title: a.title,
    type: a.type,
    domains: a.domains,
    capabilities: a.capabilities,
    codeGlobs: a.codeGlobs,
    source: a.source || undefined,
    hasOwnership: a.codeGlobs.length > 0,
  }))
}

/** Artifacts that have no declared ownership (`code:` absent or empty). */
export function artifactsMissingOwnership(artifacts: OwnershipArtifact[]): OwnershipArtifact[] {
  return artifacts.filter((a) => !a.hasOwnership)
}

/** Load deterministic scan signals from `.kaddo/scan.json`. Returns null if unavailable. */
export function loadScanSignals(dir: string): ScanSignals | null {
  const scanPath = join(dir, SCAN_PATH)
  if (!exists(scanPath)) return null
  try {
    const parsed = JSON.parse(readFile(scanPath)) as {
      detected?: Record<string, unknown>
    }
    const detected = parsed.detected ?? {}
    return {
      sourceDirectories: toStringArray(detected.sourceDirectories),
      migrationDirectories: toStringArray(detected.migrationDirectories),
      contractFiles: toStringArray(detected.contractFiles),
      infrastructureFiles: toStringArray(detected.infrastructureFiles),
    }
  } catch {
    return null
  }
}

/** Normalize a domain/capability into a path-segment term, e.g. "Payment Processing" → "payment-processing". */
function normalizeTerm(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function termsFor(artifact: OwnershipArtifact): string[] {
  const seen = new Set<string>()
  for (const v of [...artifact.domains, ...artifact.capabilities]) {
    const t = normalizeTerm(v)
    if (t) seen.add(t)
  }
  return [...seen]
}

/**
 * Suggest candidate `code:` globs for an artifact from scan signals + artifact metadata.
 * Ordered most-specific first. Returns [] when no signals exist (manual entry path).
 */
export function suggestGlobs(
  artifact: OwnershipArtifact,
  signals: ScanSignals | null
): string[] {
  const out: string[] = []
  if (signals) {
    const terms = termsFor(artifact)
    // Most specific: source dir + domain/capability term.
    for (const dir of signals.sourceDirectories) {
      for (const term of terms) out.push(`${dir}/${term}/**`)
    }
    // Generic source directories.
    for (const dir of signals.sourceDirectories) out.push(`${dir}/**`)
    // Migrations.
    for (const dir of signals.migrationDirectories) out.push(`${dir}/**`)
    // Contracts / infrastructure as literal candidates.
    for (const f of signals.contractFiles) out.push(f)
    for (const f of signals.infrastructureFiles) out.push(f)
  }
  return [...new Set(out)]
}

export type MergeMode = 'append' | 'replace'

/**
 * Return new file content with `code:` set to the chosen globs, preserving every other front
 * matter key and the body verbatim. `append` merges with existing globs; `replace` overwrites.
 */
export function applyOwnership(
  raw: string,
  globs: string[],
  mode: MergeMode = 'replace'
): string {
  const parsed = matter(raw)
  const existing = toStringArray((parsed.data as Record<string, unknown>).code)
  const next =
    mode === 'append' ? [...new Set([...existing, ...globs])] : [...new Set(globs)]
  // Clone data — gray-matter caches parsed objects; never mutate the cached reference.
  const data = { ...(parsed.data as Record<string, unknown>), code: next }
  return matter.stringify(parsed.content, data)
}
